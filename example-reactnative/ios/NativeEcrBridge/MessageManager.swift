import Foundation
import OSLog

class MessageManager: NSObject {
    private let logger = Logger(subsystem: "com.paynl.ecr", category: "MessageManager")

    private var connectedTerminal: PosTerminal?
    private var connectionCompletion: (RCTPromiseResolveBlock, RCTPromiseRejectBlock)?
    private var inputStream: InputStream?
    private var outputStream: OutputStream?
    private let maxBufferSize = 1024
    private let port: UInt32 = 8888

    func getStatus() -> PosTerminal? {
        connectedTerminal
    }

    func connect(
        terminal: PosTerminal,
        resolve: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        logger.info("Connecting to \(terminal.sourceIp)")
        var readStream: Unmanaged<CFReadStream>?
        var writeStream: Unmanaged<CFWriteStream>?

        CFStreamCreatePairWithSocketToHost(
            kCFAllocatorDefault,
            terminal.sourceIp as CFString,
            port,
            &readStream,
            &writeStream
        )

        guard let input = readStream?.takeRetainedValue(),
              let output = writeStream?.takeRetainedValue()
        else {
            logger.error("Failed to create streams")
            rejecter("Failed to create streams", "", NSError())
            return
        }

        inputStream = input as InputStream
        outputStream = output as OutputStream

        inputStream?.delegate = self
        outputStream?.delegate = self

        inputStream?.schedule(in: .main, forMode: .default)
        outputStream?.schedule(in: .main, forMode: .default)

        inputStream?.open()
        outputStream?.open()
        connectedTerminal = terminal
        connectionCompletion = (resolve, rejecter)
    }

    // Disconnect from server
    func disconnect() {
        inputStream?.close()
        outputStream?.close()
        inputStream?.remove(from: .main, forMode: .default)
        outputStream?.remove(from: .main, forMode: .default)
        inputStream = nil
        outputStream = nil
        connectedTerminal = nil
    }

    // Send message to server
    func send(message: PosMessage) {
        do {
            var data = try JSONEncoder().encode(message)

            // append new line (LF) for message submission
            data.append(0x0A)

            logger.info("Sending message: \(String(data: data, encoding: .utf8) ?? "empty")")
            data.withUnsafeBytes { buffer in
                guard let pointer = buffer.baseAddress?.assumingMemoryBound(to: UInt8.self) else {
                    self.logger.error("Pointer is empty...")
                    return
                }
                outputStream?.write(pointer, maxLength: data.count)
            }
        } catch {
            logger.error("Failed to encode message: \(error)")
        }
    }

    private func receive() {
        var buffer = [UInt8](repeating: 0, count: maxBufferSize)
        let bytesRead = inputStream?.read(&buffer, maxLength: maxBufferSize) ?? 0

        if bytesRead > 0 {
            let data = Data(bytes: buffer, count: bytesRead)
            if let message = String(data: data, encoding: .utf8) {
                logger.info("Received: \(message)")
            }

            do {
                let reply = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                EcrEventEmitter.emit(onReply: reply)
            } catch {
                logger.error("Failed to decode message: \(error)")
            }
        }
    }
}

extension MessageManager: StreamDelegate {
    func stream(_ aStream: Stream, handle eventCode: Stream.Event) {
        switch eventCode {
        case .openCompleted:
            if aStream == outputStream {
                connectionCompletion?.0(nil)
                connectionCompletion = nil
                logger.info("Connection opened")
            }
        case .hasBytesAvailable:
            if aStream == inputStream {
                receive()
            }
        case .errorOccurred:
            connectionCompletion?.1("Error occurred", "Error: \(aStream.streamError?.localizedDescription ?? "Unknown")", aStream.streamError)
            connectionCompletion = nil
            logger.info("Error: \(aStream.streamError?.localizedDescription ?? "Unknown")")
        case .endEncountered:
            logger.error("Connection ended")
            disconnect()
        default:
            break
        }
    }
}

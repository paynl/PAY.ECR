import Darwin
import Foundation
import OSLog

class DiscoveryManager {
    private let logger = Logger(subsystem: "com.paynl.ecr", category: "DiscoveryManager")

    private let whoIsMessage = "PAY.POS-WHO.IS".data(using: .utf8)
    private let iAmMessage = "PAY.POS-I.AM:"
    private let udpPort: UInt16 = 8889

    private var socket: Int32 = -1
    private var receiveTask: Task<Void, Never>?
    private var localSubnet: (base: String, count: Int)?
    private var localIP: String? // Store our own IP to skip it

    var isDiscovering: Bool {
        socket != -1
    }

    func startDiscovery() {
        logger.info("Start PAYNL discovery protocol")

        // Discover local subnet and IP
        guard let subnet = discoverLocalSubnet() else {
            logger.error("Failed to discover local subnet")
            return
        }
        localSubnet = subnet
        let localIp = localIP
        logger.info("Local subnet: \(subnet.base).0/24 (self: \(localIp ?? "unknown"))")

        guard startListening() else {
            logger.error("Failed to start listening")
            return
        }

        guard broadcastDiscovery() else {
            logger.error("Failed to send discovery broadcast")
            return
        }
    }

    func stopDiscovery() {
        guard isDiscovering else { return }
        closeSocket()
    }

    /// Discover the local subnet and our IP address
    private func discoverLocalSubnet() -> (base: String, count: Int)? {
        var ifaddr: UnsafeMutablePointer<ifaddrs>?

        guard getifaddrs(&ifaddr) == 0, let firstAddr = ifaddr else {
            return nil
        }

        defer { freeifaddrs(ifaddr) }

        let preferredOrder = ["en0", "en1", "bridge0", "en2", "en3"]
        var foundInterfaces: [(name: String, ip: String)] = []

        var current = firstAddr
        while true {
            if let addr = current.pointee.ifa_addr,
               addr.pointee.sa_family == UInt8(AF_INET)
            {
                let name = String(cString: current.pointee.ifa_name)

                let isExcluded = name == "lo0" ||
                    name.hasPrefix("pdp_ip") ||
                    name.hasPrefix("utun") ||
                    name.hasPrefix("ap") ||
                    name.hasPrefix("ipsec")

                if !isExcluded {
                    var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    let result = getnameinfo(
                        addr,
                        socklen_t(addr.pointee.sa_len),
                        &hostname,
                        socklen_t(hostname.count),
                        nil,
                        0,
                        NI_NUMERICHOST
                    )

                    if result == 0 {
                        let ipString = String(cString: hostname)

                        if !ipString.hasPrefix("169.254.") {
                            foundInterfaces.append((name, ipString))
                        }
                    }
                }
            }

            guard let next = current.pointee.ifa_next else { break }
            current = next
        }

        // Find preferred interface and store our IP
        for preferred in preferredOrder {
            if let entry = foundInterfaces.first(where: { $0.name == preferred }) {
                localIP = entry.ip // Store our IP
                logger.info("Using interface: \(entry.name) (\(entry.ip))")
                return parseSubnet(from: entry.ip)
            }
        }

        if let first = foundInterfaces.first {
            localIP = first.ip
            return parseSubnet(from: first.ip)
        }

        return nil
    }

    /// Parse IP address to extract subnet (e.g., "192.168.100.19" -> ("192.168.100", 254))
    private func parseSubnet(from ip: String) -> (base: String, count: Int)? {
        let parts = ip.split(separator: ".").compactMap { Int($0) }
        guard parts.count == 4 else { return nil }

        let base = "\(parts[0]).\(parts[1]).\(parts[2])"
        return (base, 254)
    }

    /// Send discovery message to all IPs in the subnet (except ourselves)
    private func broadcastDiscovery() -> Bool {
        guard let subnet = localSubnet, let data = whoIsMessage else {
            return false
        }

        logger.info("Sending discovery to all hosts in \(subnet.base).0/24")

        let startIP = 1
        let endIP = subnet.count

        var successCount = 0
        var skippedCount = 0

        for host in startIP ... endIP {
            let targetIP = "\(subnet.base).\(host)"

            // Skip our own IP address
            if targetIP == localIP {
                skippedCount += 1
                continue
            }

            if sendUnicast(data: data, to: targetIP, port: udpPort) {
                successCount += 1
            }
        }

        logger.info("Sent discovery to \(successCount) hosts (skipped self: \(skippedCount))")
        return successCount > 0
    }

    /// Send message to specific IP (unicast)
    private func sendUnicast(data: Data, to ip: String, port: UInt16) -> Bool {
        guard socket >= 0 else {
            return false
        }

        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = port.bigEndian

        guard inet_pton(AF_INET, ip, &addr.sin_addr) == 1 else {
            return false
        }

        let sendResult = data.withUnsafeBytes { dataPtr in
            withUnsafePointer(to: &addr) { addrPtr in
                addrPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPtr in
                    sendto(socket, dataPtr.baseAddress, data.count, 0, sockaddrPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
                }
            }
        }

        return sendResult >= 0
    }

    private func createSocket() -> Int32? {
        let sock = Darwin.socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)
        guard sock >= 0 else {
            logger.error("Error creating socket: \(String(cString: strerror(errno)))")
            return nil
        }

        var reuseAddr: Int32 = 1
        setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &reuseAddr, socklen_t(MemoryLayout<Int32>.size))

        var reusePort: Int32 = 1
        setsockopt(sock, SOL_SOCKET, SO_REUSEPORT, &reusePort, socklen_t(MemoryLayout<Int32>.size))

        var timeout = timeval(tv_sec: 1, tv_usec: 0)
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))

        return sock
    }

    private func startListening() -> Bool {
        guard !isDiscovering else {
            logger.info("Already listening")
            return true
        }

        guard let sock = createSocket() else {
            logger.error("Failed to create socket")
            return false
        }
        socket = sock

        guard bindSocket(socket) else {
            closeSocket()
            return false
        }

        receiveTask = Task {
            self.receiveLoop()
        }

        return true
    }

    private func bindSocket(_ sock: Int32) -> Bool {
        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = udpPort.bigEndian
        addr.sin_addr.s_addr = INADDR_ANY

        let bindResult = withUnsafePointer(to: &addr) { addrPtr in
            addrPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPtr in
                bind(sock, sockaddrPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }

        if bindResult < 0 {
            logger.error("Error binding socket: \(String(cString: strerror(errno)))")
            return false
        }

        logger.info("Socket bound to port 8889")
        return true
    }

    private func closeSocket() {
        if socket >= 0 {
            close(socket)
            socket = -1
        }
    }

    private func receiveLoop() {
        let bufferSize = 65536
        var buffer = [UInt8](repeating: 0, count: bufferSize)

        logger.info("Listening for responses")

        let startTime = Date()
        let discoveryTimeout: TimeInterval = 5.0

        while isDiscovering, socket >= 0 {
            if Date().timeIntervalSince(startTime) > discoveryTimeout {
                logger.info("Discovery timeout reached")
                break
            }

            if Task.isCancelled { break }

            var senderAddr = sockaddr_in()
            var addrLen = socklen_t(MemoryLayout<sockaddr_in>.size)

            let bytesRead = withUnsafeMutablePointer(to: &senderAddr) { addrPtr in
                addrPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPtr in
                    recvfrom(socket, &buffer, bufferSize, 0, sockaddrPtr, &addrLen)
                }
            }

            if bytesRead < 0 {
                if errno == EAGAIN || errno == EWOULDBLOCK {
                    continue
                }
                if errno == EINTR {
                    continue
                }
                logger.error("Receive error: \(String(cString: strerror(errno)))")
                break
            }

            if bytesRead == 0 { continue }

            let senderIP = String(cString: inet_ntoa(senderAddr.sin_addr))

            // Ignore responses from ourselves
            if senderIP == localIP {
                continue
            }

            let data = Data(buffer[0 ..< bytesRead])

            guard let message = String(data: data, encoding: .utf8) else {
                logger.warning("Invalid message received from \(senderIP)")
                continue
            }

            guard message.starts(with: iAmMessage) else {
                logger.warning("Unknown message from \(senderIP): \(message)")
                continue
            }

            let splitted = message.split(separator: ":")
            guard splitted.count == 3 else {
                logger.warning("Invalid message format from \(senderIP): \(message)")
                continue
            }

            let dict: [String: Any] = [
                "sourceIp": senderIP,
                "terminalCode": String(splitted[1]),
                "terminalName": String(splitted[2]),
            ]

            logger.info("Found terminal: \(String(splitted[1])) at \(senderIP)")
            EcrEventEmitter.emit(onDiscovery: dict)
        }

        stopDiscovery()
    }
}

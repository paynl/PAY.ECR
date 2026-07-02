import Foundation

@objc(EcrBridgeService) class EcrBridgeService: NSObject {
    @objc static let shared = EcrBridgeService()

    private let discoveryManager: DiscoveryManager
    private let messageManager: MessageManager

    override init() {
        discoveryManager = DiscoveryManager()
        messageManager = MessageManager()

        super.init()
    }

    @objc func getIsDiscovering() -> NSNumber {
        discoveryManager.isDiscovering ? 1 : 0
    }

    @objc func startDiscovery(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter _: @escaping RCTPromiseRejectBlock
    ) {
        discoveryManager.startDiscovery()
        resolve(nil)
    }

    @objc func stopDiscovery(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter _: @escaping RCTPromiseRejectBlock
    ) {
        discoveryManager.stopDiscovery()
        resolve(nil)
    }

    @objc func connect(
        terminal: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let sourceIp = terminal["sourceIp"] as? String,
              let terminalCode = terminal["terminalCode"] as? String,
              let terminalName = terminal["terminalName"] as? String
        else {
            reject("Invalid terminal data", "Missing data", NSError())
            return
        }

        let posTerminal = PosTerminal(sourceIp: sourceIp, terminalCode: terminalCode, terminalName: terminalName)
        messageManager.connect(terminal: posTerminal, resolve: resolve, rejecter: reject)
    }

    @objc func disconnect(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter _: @escaping RCTPromiseRejectBlock
    ) {
        guard messageManager.getStatus() != nil else {
            resolve(nil)
            return
        }

        messageManager.disconnect()
        resolve(nil)
    }

    @objc func sendMessage(
        data: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let message = parseMessage(data: data) else {
            reject("Failed to parse message", "Failed to parse message", NSError())
            return
        }

        messageManager.send(message: message)
        resolve(nil)
    }

    @objc func getStatus() -> NSDictionary? {
        guard let status = messageManager.getStatus() else {
            return nil
        }

        return [
            "sourceIp": status.sourceIp,
            "terminalCode": status.terminalCode,
            "terminalName": status.terminalName,
        ]
    }

    @objc func setPin(code: String) {
        messageManager.setPincode(code)
    }

    private func parseMessage(data: NSDictionary) -> PosMessage? {
        guard let type = data["type"] as? String else {
            return nil
        }

        var transaction: PayNLTransaction? = nil
        if let transactionData = data["transaction"] as? NSDictionary {
            var order: PayNLOrder? = nil
            if let orderData = transactionData["order"] as? NSDictionary {
                var products: [PayNLProduct] = []
                if let productsDataArray = orderData["products"] as? [[String: Any]] {
                    products = productsDataArray.map { product in
                        var price: PayNLAmount? = nil
                        if let priceData = product["price"] as? NSDictionary {
                            price = PayNLAmount(
                                value: priceData["value"] as? Int ?? 0,
                                currency: priceData["currency"] as? String ?? "EUR"
                            )
                        }

                        return PayNLProduct(
                            id: product["id"] as? String,
                            description: product["description"] as? String,
                            type: product["type"] as? String,
                            price: price,
                            quantity: product["quantity"] as? Int,
                            vatPercentage: product["vatPercentage"] as? Int
                        )
                    }
                }

                order = PayNLOrder(products: products)
            }

            let amountData = transactionData["amount"] as? NSDictionary

            transaction = PayNLTransaction(
                type: transactionData["type"] as? String ?? "PAYMENT",
                amount: PayNLAmount(
                    value: amountData?["value"] as? Int ?? 0,
                    currency: amountData?["currency"] as? String ?? "EUR"
                ),
                description: transactionData["description"] as? String,
                reference: transactionData["reference"] as? String,
                order: order
            )
        }

        var service: PayNLService? = nil
        if let serviceData = data["service"] as? NSDictionary {
            service = PayNLService(
                serviceId: serviceData["serviceId"] as? String ?? "",
                secret: serviceData["secret"] as? String ?? ""
            )
        }

        return PosMessage(
            type: type,
            transaction: transaction,
            service: service,
            needle: data["needle"] as? String
        )
    }
}

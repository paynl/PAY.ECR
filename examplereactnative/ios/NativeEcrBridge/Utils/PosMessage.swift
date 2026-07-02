struct PosMessage: Codable {
    let type: String
    var hash: String?
    let transaction: PayNLTransaction?
    let service: PayNLService?
    let needle: String?
}

struct PayNLService: Codable {
    let serviceId: String
    let secret: String
}

/*
 * More properties are supported, this is for MVP.
 * See: https://developer.pay.nl/reference/api_create_order-1#body-params
 */
struct PayNLTransaction: Codable {
    /** Possible value: PAYMENT, REFUND, AUTH */
    let type: String
    let amount: PayNLAmount
    let description: String?
    let reference: String?
    let order: PayNLOrder?
}

struct PayNLOrder: Codable {
    let products: [PayNLProduct]?
}

struct PayNLProduct: Codable {
    let id: String?
    let description: String?
    let type: String?
    let price: PayNLAmount?
    let quantity: Int?
    let vatPercentage: Int?
}

struct PayNLAmount: Codable {
    let value: Int
    let currency: String
}

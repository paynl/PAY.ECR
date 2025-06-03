<img src="https://www.pay.nl/uploads/1/brands/main_logo.png" width="100px" />

# PAY.POS Local ECR - Message protocol (TCP)

### Important data:
- The message protocol uses TCP (unlike the discovery protocol) on port 8888 - This ensures the packets are received correctly
- The message protocol uses JSON objects with UTF-8 encoding

### Messages

#### PING message
To ensure you are able to connect to the terminal you can always send a PING message.

##### Request
| **Property** | **Type/value**  | **Description**                                                 |
|--------------|-----------------|-----------------------------------------------------------------|
| `type`       | `PING` (String) |                                                                 |

##### Response
| **Property** | **Type/value**  | **Description**                                                                                                 |
|--------------|-----------------|-----------------------------------------------------------------------------------------------------------------|
| `type`       | `PONG` (String) |                                                                                                                 |
| `status`     | String          | Represents the current state of the terminal. Possible values: `IDLE`, `BOOTING`, `ORDER_PRESENTING`, or `BUSY` |

#### ERROR message
Every message can respond with an error message.
Be prepared for this.

##### Response
| **Property** | **Type/value**   | **Description**                                     |
|--------------|------------------|-----------------------------------------------------|
| `type`       | `ERROR` (String) |                                                     |
| `reason`     | String           | The reason of the error. Might contain an exception |

#### TRANSACTION_START
If you want to start a transaction, use this message. NOTE: you will receive [`TRANSACTION_EVENT`](#transaction_event) during the transaction

##### Request
| **Property**        | **Type/value**               | **Description**                                                                                                            |
|---------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| `type`              | `TRANSACTION_START` (String) |                                                                                                                            |
| `transaction`       | Object                       | The transaction object (see [Order:Create](https://developer.pay.nl/reference/api_create_order-1) for the possible values) |
| `service`           | Object                       | If you want to use service injection, make sure these values are provided                                                  |
| `service.serviceId` | String                       |                                                                                                                            |
| `service.secret`    | String                       |                                                                                                                            |

#### TRANSACTION_STOP
If you want to cancel a running transaction, use this

##### Request
| **Property**        | **Type/value**              | **Description**  |
|---------------------|-----------------------------|------------------|
| `type`              | `TRANSACTION_STOP` (String) |                  |

#### TRANSACTION_EVENT
During a transaction, you will receive these events

##### Response
| **Property** | **Type/value**                                                                                                | **Description**                                                                                                                                                                                           |
|--------------|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `type`       | `TRANSACTION_EVENT` (String)                                                                                  |                                                                                                                                                                                                           |
| `event`      | `STARTED`, `PROCESSING`, `CANCELLED`, `COMPLETED`, `FAILED`, `QUEUED`, `PIN_INPUT_PENDING`, `PIN_INPUT_ERROR` | The different events during the transaction. NOTE: the transaction is only in a 'finished' state when the following events have been sent: `CANCELLED`, `COMPLETED`, `FAILED`, `QUEUED`,`PIN_INPUT_ERROR` |
| `approved`   | Boolean                                                                                                       | When in `COMPLETED` the transaction can be approved or declined                                                                                                                                           |
| `message`    | String                                                                                                        | Some extra information regarding                                                                                                                                                                          |

#### HISTORY_LIST

If you wish to get the transaction history of the terminal, use this.
NOTE: The terminal only stores the last 20 transactions and will return a summarised version.
To get the full transaction use [HISTORY_GET](#history_get)

##### Request
| **Property** | **Type/value**          | **Description** |
|--------------|-------------------------|-----------------|
| `type`       | `HISTORY_LIST` (String) |                 |

##### Response
| **Property**        | **Type/value**                    | **Description**                                                                           |
|---------------------|-----------------------------------|-------------------------------------------------------------------------------------------|
| `type`              | `HISTORY_LIST_RESPONSE` (String)  |                                                                                           |
| `items`             | Array                             |                                                                                           |
| `items[].id `       | String or null                    | The MV-code of the transaction (might be null if transaction has not reached `COMPLETED`) |
| `items[].orderId`   | String or null                    | The orderId of the transaction (might be null if transaction has not reached `COMPLETED`) | 
| `items[].reference` | String or null                    |                                                                                           |
| `items[].status`    | String                            | `CANCEL`, `FAILED`, `SUCCESS`, `EXPIRED`, `QUEUED`                                        |
| `items[].createdAt` | ISO8601 (String)                  | The datetime of when transaction was "finished"                                           |

#### HISTORY_GET

This will return the complete transaction or an ERROR message if not found

##### Request
| **Property** | **Type/value**         | **Description**                                          |
|--------------|------------------------|----------------------------------------------------------|
| `type`       | `HISTORY_GET` (String) |                                                          |
| `needle`     | String                 | The needle can be either: MV-code, OrderId, or reference |

##### Response
| **Property**  | **Type/value**                  | **Description**                                                                           |
|---------------|---------------------------------|-------------------------------------------------------------------------------------------|
| `type`        | `HISTORY_GET_RESPONSE` (String) |                                                                                           |
| `id `         | String or null                  | The MV-code of the transaction (might be null if transaction has not reached `COMPLETED`) |
| `orderId`     | String or null                  | The orderId of the transaction (might be null if transaction has not reached `COMPLETED`) | 
| `reference`   | String or null                  |                                                                                           |
| `status`      | String                          | `CANCEL`, `FAILED`, `SUCCESS`, `EXPIRED`, `QUEUED`                                        |
| `description` | String or null                  |                                                                                           |
| `createdAt`   | ISO8601 (String)                | The datetime of when transaction was "finished"                                           |
| `ticket`      | Base64 String or null           |                                                                                           |
| `amount`      | long                            |                                                                                           |
| `currency`    | String                          |                                                                                           |
| `cardNumber`  | String or null                  | A masked version of the card number                                                       |

#### ORDER_CREATE / ORDER_UPDATE

This is a special mode in the PAY.POS app, which allows you to use the terminal to show the products to the customer.
You can create an order once, update it infinite times, start it once, and needs to be cancelled via [ORDER_STOP](#order_stop), before you can create a new one.

##### Request
| **Property**        | **Type/value**                           | **Description**                                                                                                                          |
|---------------------|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `type`              | `ORDER_CREATE` / `ORDER_UPDATE` (String) | Use `ORDER_CREATE` once and use `ORDER_UPDATE` to add or delete new items. ORDER_UPDATE will overwrite the current order in the terminal |
| `transaction`       | Object                                   | The transaction object (see [Order:Create](https://developer.pay.nl/reference/api_create_order-1) for the possible values)               |
| `service`           | Object                                   | If you want to use service injection, make sure these values are provided                                                                |
| `service.serviceId` | String                                   |                                                                                                                                          |
| `service.secret`    | String                                   |                                                                                                                                          |

#### ORDER_STOP

##### Request
| **Property**     | **Type/value**        | **Description** |
|------------------|-----------------------|-----------------|
| `type`           | `ORDER_STOP` (String) |                 |

#### ORDER_START

In order to transform the order into a payment and start card scan, send the `ORDER_START` message to the terminal

##### Request
| **Property**     | **Type/value**          | **Description** |
|------------------|-------------------------|-----------------|
| `type`           | `ORDER_START` (String)  |                 |

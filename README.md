<img src="https://www.pay.nl/uploads/1/brands/main_logo.png" width="100px" />

# PAY.ECR

### Requirments:
- PAY.POS version 1.1.18 or higher
- Android terminals only (Android softpos, Sunmi hardpos, and PAX hardpos)
- Your network needs to be able to send UDP (port 8889) & TCP (port 8888) messages

### Getting started
- [Discovery protocol](./docs/discovery_protocol.md)
- [Message protocol](./docs/message_protocol.md)

### Order presentation screen

Instead of using `TRANSACTION_START`, use `ORDER_CREATE` and `ORDER_UPDATE` to get the following screen:

<img src="./OrderPresentation.png" width="200">

<img src="https://www.pay.nl/uploads/1/brands/main_logo.png" width="100px" />

# PAY.POS Local ECR - Message protocol (TCP)

### Important data:
- The message protocol uses TCP (unlike the discovery protocol) on port 8888 - This ensures the packets are received correctly
- The message protocol uses JSON objects with UTF-8 encoding

### Security


### Messages

#### PING message
To ensure you are able to connect to the terminal you can always send a PING message.

##### Request
| **Property** | **Type/value**  | **Description**                                                 |
|--------------|-----------------|-----------------------------------------------------------------|
| `type`       | `PING` (String) |                                                                 |
| `timestamp`  | Number          | Unix timestamp since 1970 - More info [see Security](#Security) |
| `auth`       | String          | The security token - More info  [see Security](#Security)       |

##### Response
| **Property** | **Type/value**  | **Description**                                                                             |
|--------------|-----------------|---------------------------------------------------------------------------------------------|
| `type`       | `PONG` (String) |                                                                                             |
| `status`     | String          | Represents the current state of the terminal. Possible values: `IDLE`, `BOOTING`, or `BUSY` |


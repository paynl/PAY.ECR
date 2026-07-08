# PAY.ECR — Agent Guide

This document explains how to integrate with the PAY.POS Local ECR (Electronic Cash Register) protocol. The protocol is split into two layers: **Discovery** (finding terminals on the network) and **Messaging** (communicating with a terminal to drive transactions).

---

## Overview

The ECR protocol allows a POS system to communicate with PAY.POS payment terminals on the local network. There are two distinct protocols:

| Layer     | Transport | Port | Purpose                          |
|-----------|-----------|------|----------------------------------|
| Discovery | UDP       | 8889 | Locate terminals on the LAN      |
| Messaging | TCP       | 8888 | Send commands and receive events |

All message payloads use **JSON with UTF-8 encoding**.

---

## Step 1 — Terminal Discovery (UDP, port 8889)

Before you can send any commands, you need to know the IP address of the terminal. Use the UDP discovery protocol to find all PAY.POS terminals on the local network.

### How it works

1. Open a UDP socket and enable broadcast mode.
2. Send the string `PAY.POS-WHO.IS` (UTF-8) as a broadcast to `255.255.255.255:8889`.
3. Listen for responses for a few seconds (recommended: 3000 ms).
4. Each compatible terminal (version 1.1.17 or higher) will reply with:
   ```
   PAY.POS-I.AM:<TERMINAL_CODE>:<TERMINAL_NAME>
   ```
   Example: `PAY.POS-I.AM:TH-1234-5678:Checkout Terminal 1`
5. Parse the response by splitting on `:` — field 0 is the message type, field 1 is the terminal code, field 2 is the human-readable name. The sender's IP address (from the UDP packet metadata) is the terminal's IP.

### Discovery flow

```
POS  --[UDP broadcast 255.255.255.255:8889 "PAY.POS-WHO.IS"]--> Router
                                                                    |
                                            Terminal 1 <-----------+
Terminal 1  --["PAY.POS-I.AM:TH-1234-5678:Checkout 1"]--> POS
                                            Terminal 2 <-----------+
Terminal 2  --["PAY.POS-I.AM:TH-9876-5432:Checkout 2"]--> POS
```

### Example (Node.js)

```js
const DISCOVERY_PORT = 8889;
const DISCOVERY_MESSAGE = 'PAY.POS-WHO.IS';
const DISCOVERY_RESPONSE_MESSAGE = 'PAY.POS-I.AM';
const DISCOVERY_TIMEOUT = 3000;

const socket = dgram.createSocket('udp4');

socket.on('message', (buffer, info) => {
  const parts = buffer.toString().split(':');
  if (parts.length !== 3 || parts[0] !== DISCOVERY_RESPONSE_MESSAGE) return;

  console.log({
    ipAddress: info.address,
    code: parts[1],
    name: parts[2],
  });
});

socket.bind(() => {
  socket.setBroadcast(true);
  const msg = Buffer.from(DISCOVERY_MESSAGE);
  socket.send(msg, 0, msg.length, DISCOVERY_PORT, '255.255.255.255');

  setTimeout(() => socket.close(), DISCOVERY_TIMEOUT);
});
```

---

## Step 2 — Terminal Communication (TCP, port 8888)

Once you have the terminal's IP from discovery, open a **TCP connection** to `<terminal-ip>:8888`. All messages are JSON objects encoded in UTF-8.

> **Important:** Every message type can result in an `ERROR` response. Always handle it.

---

## Messages

### PING / PONG — Health check

Use this to verify connectivity and check the terminal's current status before sending commands.

**Request:**
```json
{ "type": "PING" }
```

**Response:**
```json
{
  "type": "PONG",
  "status": "IDLE"
}
```

`status` values: `IDLE`, `BOOTING`, `ORDER_PRESENTING`, `BUSY`

---

### ERROR — Error response

Any request may result in this response instead of the expected reply. Always handle it.

```json
{
  "type": "ERROR",
  "reason": "Description of what went wrong"
}
```

---

### TRANSACTION_START — Initiate a payment

Start a payment, refund, or authorisation transaction. While the transaction is running, the terminal will emit `TRANSACTION_EVENT` messages.

**Request:**
```json
{
  "type": "TRANSACTION_START",
  "transaction": {
    "type": "PAYMENT",
    "amount": 1000,
    "currency": "EUR"
  },
  "service": {
    "serviceId": "SL-XXXX-XXXX",
    "secret": "your-secret"
  }
}
```

`transaction.type` options: `PAYMENT`, `REFUND`, `AUTH`

The `service` object is only required if you use service injection. Refer to the [PAY. Order:Create API](https://developer.pay.nl/reference/api_create_order-1) for the full list of transaction fields.

---

### TRANSACTION_EVENT — Real-time transaction updates

During a transaction, the terminal pushes these events over the open TCP connection. You do **not** request them — they arrive automatically.

```json
{
  "type": "TRANSACTION_EVENT",
  "event": "COMPLETED",
  "approved": true,
  "message": "Transaction approved",
  "orderId": "1234567890X1234a",
  "ticket": "<base64-utf8-encoded-receipt>"
}
```

| `event` value      | Terminal state | Is terminal done? |
|--------------------|----------------|-------------------|
| `STARTED`          | Starting up    | No                |
| `PROCESSING`       | Processing     | No                |
| `PIN_INPUT_PENDING`| Waiting for PIN| No                |
| `PIN_INPUT_ERROR`  | Wrong PIN      | No                |
| `COMPLETED`        | Done           | **Yes**           |
| `CANCELLED`        | Done           | **Yes**           |
| `FAILED`           | Done           | **Yes**           |
| `QUEUED`           | Done (offline) | **Yes**           |

When `event` is `COMPLETED`, check `approved` (boolean) to determine whether the payment was accepted or declined. If approved:
- `orderId` — use this to query the PAY. API for full transaction details.
- `ticket` — a Base64-UTF-8 encoded receipt. You **must** offer the customer the option to print or receive it by email.

---

### TRANSACTION_STOP — Cancel a running transaction

Send this to abort a transaction that is currently in progress.

**Request:**
```json
{ "type": "TRANSACTION_STOP" }
```

---

### HISTORY_LIST — List recent transactions

Returns a summary of the last 20 transactions stored on the terminal.

**Request:**
```json
{ "type": "HISTORY_LIST" }
```

**Response:**
```json
{
  "type": "HISTORY_LIST_RESPONSE",
  "items": [
    {
      "id": "MV-XXXX-XXXX",
      "orderId": "1234567890X1234a",
      "reference": "your-reference",
      "status": "SUCCESS",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

`status` values: `SUCCESS`, `CANCEL`, `FAILED`, `EXPIRED`, `QUEUED`

`id` and `orderId` may be `null` if the transaction never reached `COMPLETED`.

---

### HISTORY_GET — Get a full transaction record

Retrieve complete details for a specific transaction. Returns an `ERROR` if not found.

**Request:**
```json
{
  "type": "HISTORY_GET",
  "needle": "MV-XXXX-XXXX"
}
```

`needle` can be the MV-code, orderId, or your own reference string.

**Response:**
```json
{
  "type": "HISTORY_GET_RESPONSE",
  "id": "MV-XXXX-XXXX",
  "orderId": "1234567890X1234a",
  "reference": "your-reference",
  "status": "SUCCESS",
  "description": "...",
  "createdAt": "2025-01-01T12:00:00Z",
  "ticket": "<base64-string-or-null>",
  "amount": 1000,
  "currency": "EUR",
  "cardNumber": "****1234"
}
```

---

### ORDER_CREATE / ORDER_UPDATE / ORDER_START / ORDER_STOP — Customer-facing order mode

This is an optional interactive mode where the terminal displays the order to the customer before payment is initiated. It enables a customer-facing workflow.

**Lifecycle (must follow this order):**

1. `ORDER_CREATE` — Send once to create an order and display it on the terminal.
2. `ORDER_UPDATE` — Optionally send multiple times to update the order (e.g. add/remove items). Overwrites the current order.
3. `ORDER_START` — Converts the displayed order into a live transaction and starts the card reader.
4. `ORDER_STOP` — Cancels and clears the order. Must be called before creating a new order.

**ORDER_CREATE / ORDER_UPDATE request:**
```json
{
  "type": "ORDER_CREATE",
  "transaction": {
    "amount": 2500,
    "currency": "EUR"
  },
  "service": {
    "serviceId": "SL-XXXX-XXXX",
    "secret": "your-secret"
  }
}
```

**ORDER_START request:**
```json
{ "type": "ORDER_START" }
```

After `ORDER_START`, the terminal begins emitting `TRANSACTION_EVENT` messages exactly like a normal `TRANSACTION_START` flow.

**ORDER_STOP request:**
```json
{ "type": "ORDER_STOP" }
```

---

## Typical Integration Flows

### Simple payment

```
1. Discover terminal via UDP broadcast → get IP
2. Open TCP connection to <ip>:8888
3. Send PING → verify PONG status is IDLE
4. Send TRANSACTION_START
5. Receive TRANSACTION_EVENT stream
6. When event is COMPLETED/CANCELLED/FAILED/QUEUED → transaction is done
7. If approved, store orderId and present/print ticket
```

### Customer-facing order flow

```
1. Discover terminal → get IP
2. Open TCP connection to <ip>:8888
3. Send ORDER_CREATE with order contents
4. (Optional) Send ORDER_UPDATE as cart changes
5. When customer is ready to pay → send ORDER_START
6. Receive TRANSACTION_EVENT stream until terminal is done
7. Send ORDER_STOP to reset the terminal for the next order
```

---

## Key Notes for Agents

- **Always handle `ERROR` responses** — every message type can return one.
- **The TCP connection must stay open** during a transaction to receive `TRANSACTION_EVENT` pushes.
- **A transaction is only finished** when you receive `COMPLETED`, `CANCELLED`, `FAILED`, `QUEUED`, or `PIN_INPUT_ERROR`.
- **`approved` can be `false` on `COMPLETED`** — completed means the flow finished, not that payment succeeded. Always check `approved`.
- **The ticket is Base64-UTF-8 encoded** — decode before rendering. You are required to let the customer print or email it.
- **Terminal history is capped at 20 entries** — use `HISTORY_LIST` for summaries and `HISTORY_GET` for full details.
- **Discovery requires app version 1.1.17+** on the PAY.POS Android app.
- **Port summary:** UDP `8889` for discovery, TCP `8888` for all message commands.

import { Injectable, MessageEvent } from '@nestjs/common';
import {Subject} from "rxjs";
import * as dgram from "node:dgram";
import * as net from "node:net";

const DISCOVERY_PORT = 8889;
const TCP_PORT = 8888;
const DISCOVERY_MESSAGE = 'PAY.POS-WHO.IS';
const DISCOVERY_TIMEOUT = 3000; // 3 seconds

@Injectable()
export class AppService {
  private observables: {[key: string]: Subject<MessageEvent>} = {};
  private activeConnection: {[key: string]: net.Socket | undefined} = {};

  public registerSse(id: string, observable: Subject<MessageEvent>) {
    if (this.observables[id]) {
      this.observables[id].complete();
      delete this.observables[id];
    }

    this.observables[id] = observable;
  }

  public discoverTerminals(sessionId: string) {
    const stream = this.observables[sessionId];
    if (!stream) {
      console.warn('No observables found for sessionId: ' + sessionId);
      return;
    }

    let foundDevicesCount = 0;
    const socket = dgram.createSocket('udp4');
    socket.on('message', (buffer, info) => {
      foundDevicesCount++;

      const splitted = buffer.toString().split(':');
      if (splitted.length !== 3 || splitted[0] !== 'PAY.POS-I.AM') {
        console.warn('Invalid message received -> probably not a terminal');
        return;
      }

      console.log({ type: 'DISCOVER_RESULT', ipAddress: info.address, code: splitted[1], name: splitted[2] })
      stream.next({ data: { type: 'DISCOVER_RESULT', ipAddress: info.address, code: splitted[1], name: splitted[2] } });
    });

    socket.bind(() => {
      socket.setBroadcast(true);

      const message = Buffer.from(DISCOVERY_MESSAGE);
      socket.send(message, 0, message.length, DISCOVERY_PORT, '255.255.255.255');

      // Set timeout to gather responses
      setTimeout(() => {
        stream.next({ data: { type: 'DISCOVER_COMPLETED', count: foundDevicesCount } });
        socket.close();
      }, DISCOVERY_TIMEOUT);
    });
  }

  public connectToTerminal(sessionId: string, ipAddress: string) {
    const stream = this.observables[sessionId];
    if (!stream) {
      console.warn('No observables found for sessionId: ' + sessionId);
      return;
    }

    const activeConnection = this.activeConnection[sessionId];
    if (activeConnection) {
      activeConnection.end();
      this.activeConnection[sessionId] = undefined;
    }

    const client = new net.Socket();
    client.connect(TCP_PORT, ipAddress, () => {
      client.on('data', (buffer) => {
        const json = JSON.parse(buffer.toString());
        console.log(json)
        stream.next({ data: json });
      });

      this.activeConnection[sessionId] = client;
    });
  }

  public async pingDevice(sessionId: string) {
    const stream = this.observables[sessionId];
    if (!stream) {
      console.warn('No observables found for sessionId: ' + sessionId);
      return;
    }

    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const pingMessage = JSON.stringify({ type: 'PING' });
    socket.write(Buffer.from(pingMessage + '\n'));
  }

  public async startPayment(sessionId: string, data) {
    const stream = this.observables[sessionId];
    if (!stream) {
      console.warn('No observables found for sessionId: ' + sessionId);
      return;
    }

    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const startPaymentMessage = JSON.stringify({ type: 'TRANSACTION_START', data: JSON.parse(data) });
    socket.write(Buffer.from(startPaymentMessage + '\n'));
  }
}

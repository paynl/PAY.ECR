import {Injectable, MessageEvent} from '@nestjs/common';
import {Subject} from "rxjs";
import * as dgram from "node:dgram";
import * as net from "node:net";
import * as crypto from 'node:crypto';

const DISCOVERY_PORT = 8889;
const TCP_PORT = 8888;
const DISCOVERY_MESSAGE = 'PAY.POS-WHO.IS';
const DISCOVERY_TIMEOUT = 3000; // 3 seconds

type AuthData = {
  thCode: string;
  slCode: string;
}

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

  public async getSaleLocations() {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'authorization': `Basic ${Buffer.from(process.env.AT + ':' + process.env.AT_SECRET, 'utf8').toString('base64')}`,
    });

    try {
      const response = await fetch('https://rest.pay.nl/v2/services', {headers})
      return await response.json();
    } catch (e) {
      console.error('Failed to fetch sale locations')
      console.error(e)
      return null;
    }
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

      client.on('close', () => {
        stream.next({ data: JSON.stringify({disconnected: true }) });
      })

      this.activeConnection[sessionId] = client;
    });
  }

  public async pingDevice(sessionId: string, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'PING' }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async startPayment(sessionId: string, data, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'TRANSACTION_START', ...JSON.parse(data) }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async stopPayment(sessionId: string, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'TRANSACTION_STOP' }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async listHistory(sessionId: string, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'HISTORY_LIST' }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async getHistory(sessionId: string, needle: string, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'HISTORY_GET', needle }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async createOrder(sessionId: string, data, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'ORDER_CREATE', ...JSON.parse(data) }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async updateOrder(sessionId: string, data, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'ORDER_UPDATE', ...JSON.parse(data) }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async startOrder(sessionId: string, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'ORDER_START' }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  public async stopOrder(sessionId: string, auth: AuthData) {
    const socket = this.activeConnection[sessionId];
    if (!socket) {
      console.warn('No socket found for sessionId: ' + sessionId);
      return;
    }

    const message = this.generateMessage({ type: 'ORDER_STOP' }, auth);
    if (!message) {
      return;
    }

    console.log(JSON.parse(message.toString()));
    socket.write(message);
  }

  private generateMessage(body: {[key: string]: string}, auth: AuthData): Buffer | undefined {
    // Deepcopy original message
    // let message = JSON.parse(JSON.stringify(body));
    //
    // // get number from thCode & slCode
    // console.log(auth)
    // const key = (auth.thCode + auth.slCode).match(/\d+/g)?.join('');
    // if (!key) {
    //   console.error('Failed to construct key');
    //   return undefined;
    // }
    //
    // message['timestamp'] = Date.now();
    // message['auth'] = crypto
    //     .createHmac('sha256', key)
    //     .update(JSON.stringify(message))
    //     .digest("base64");

    return Buffer.from(JSON.stringify(body) + '\n');
  }
}

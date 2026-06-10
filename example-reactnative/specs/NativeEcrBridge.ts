import { TurboModule, TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

interface Spec extends TurboModule {
  start: () => void;

  /* Discovery protocol */
  getIsDiscovering: () => boolean;
  startDiscovering: () => Promise<void>;
  stopDiscovering: () => Promise<void>;

  onDiscovered: EventEmitter<PosTerminal>;

  /* Messaging protocol */
  getStatus: () => PosTerminal | undefined;
  connect: (to: PosTerminal) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: PosMessage) => Promise<void>;

  onReply: EventEmitter<PosReply>;
}

export type PosTerminal = {
  sourceIp: string;
  terminalCode: string;
  terminalName: string;
};

export type PosMessage =
  | { type: 'PING' }
  | {
      type: 'TRANSACTION_START';
      transaction: PayNLTransaction;
      service: PayNLService | undefined;
    }
  | { type: 'TRANSACTION_STOP' }
  | { type: 'HISTORY_LIST' }
  | { type: 'HISTORY_GET'; needle: string }
  | {
      type: 'ORDER_CREATE';
      transaction: PayNLTransaction;
      service: PayNLService | undefined;
    }
  | {
      type: 'ORDER_UPDATE';
      transaction: PayNLTransaction;
      service: PayNLService | undefined;
    }
  | { type: 'ORDER_STOP' }
  | { type: 'ORDER_START' };

export type TransactionEvent = | 'STARTED'
  | 'PROCESSING'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED'
  | 'QUEUED'
  | 'PIN_INPUT_PENDING'
  | 'PIN_INPUT_ERROR';

export type PosReply =
  | { type: 'PONG'; status: 'IDLE' | 'BOOTING' | 'ORDER_PRESENTING' | 'BUSY' }
  | { type: 'ERROR'; reason: string }
  | {
      type: 'TRANSACTION_EVENT';
      approved: boolean;
      message: string;
      event: TransactionEvent;
    }
  | { type: 'HISTORY_LIST_RESPONSE'; items: PayNLHistoryListItem[] }
  | {
      type: 'HISTORY_GET_RESPONSE';
      id: string | undefined;
      orderId: string | undefined;
      reference: string | undefined;
      description: string | undefined;
      status: 'CANCEL' | 'FAILED' | 'SUCCESS' | 'EXPIRED' | 'QUEUED';
      ticket: string | undefined;
      currency: string | undefined;
      cardNumber: string | undefined;
      createdAt: string;
    };

export type PayNLTransaction = {
  amount: PayNLAmount;
  description?: string;
  reference?: string;
  order?: PayNLOrder;
};

export type PayNLService = {
  serviceId: string;
  secret: string;
};

export type PayNLOrder = {
  products?: PayNLProduct[];
}

export type PayNLProduct = {
  id?: string;
  description?: string;
  type?: string;
  price?: PayNLAmount;
  quantity?: number;
  vatPercentage?: number;
};

export type PayNLHistoryListItem = {
  id: string | undefined;
  orderId: string | undefined;
  reference: string | undefined;
  status: 'CANCEL' | 'FAILED' | 'SUCCESS' | 'EXPIRED' | 'QUEUED';
  createdAt: string;
};

export type PayNLAmount = { value: number; currency: string };

export default TurboModuleRegistry.getEnforcing<Spec>('NativeEcrBridge');

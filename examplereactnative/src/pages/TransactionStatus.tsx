import { useEffect, useRef, useState } from 'react';
import type { EventSubscription } from 'react-native/Libraries/vendor/emitter/EventEmitter';
import NativeEcrBridge, {
  PosMessage,
  PosReply,
  PosTerminal,
  TransactionEvent,
} from '../../specs/NativeEcrBridge';
import {
  CommonActions,
  StaticScreenProps,
  useNavigation,
} from '@react-navigation/native';
import { useLogs } from '../context/LoggingContext';
import { TransactionStarted } from '../components/transactionStatus/TransactionStarted';
import { TransactionProcessing } from '../components/transactionStatus/TransactionProcessing';
import { TransactionCompleted } from '../components/transactionStatus/TransactionCompleted';
import { WaitingPinInput } from '../components/transactionStatus/WaitingPinInput';
import { TransactionQueued } from '../components/transactionStatus/TransactionQueued';
import { TransactionCancelled } from '../components/transactionStatus/TransactionCancelled';
import { TransactionError } from '../components/transactionStatus/TransactionError';

type Props = StaticScreenProps<{
  terminal: PosTerminal
}>;

export const TransactionStatus = (props: Props) => {
  const { appendLog } = useLogs();
  const navigation = useNavigation();
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionEvent>('STARTED');
  const [payerMessage, setPayerMessage] = useState('');
  const [approved, setApproved] = useState(false);
  const [receipt, setReciept] = useState('');
  const [orderId, setOrderId] = useState('');

  const replySubscription = useRef<EventSubscription | undefined>(undefined);

  useEffect(() => {
    replySubscription.current = NativeEcrBridge.onReply(handleReply);

    return () => {
      replySubscription.current?.remove();
      replySubscription.current = undefined;
    };
  }, []);

  const handleReply = (response: PosReply) => {
    if (response.type === 'ERROR') {
      navigation.navigate('ErrorView', { message: response.reason || '' });
      return;
    }

    if (response.type === 'TRANSACTION_EVENT') {
      setTransactionStatus(response.event);
      setPayerMessage(response.message);
      setApproved(response.approved);
      setReciept(response.ticket);
      setOrderId(response.orderId);

      if (response.event === 'COMPLETED' || response.event === 'FAILED') {
        replySubscription.current?.remove();
        replySubscription.current = undefined;
      }
      return;
    }
  };

  const transactionStopAction = () => {
    const message: PosMessage = {
      type: 'TRANSACTION_STOP',
    };
    appendLog('Sending : ' + JSON.stringify(message));
    NativeEcrBridge.sendMessage(message);

    resetBack();
  };

  const resetBack = () => {
    replySubscription.current?.remove();
    replySubscription.current = undefined;

    const message: PosMessage = {
      type: 'ORDER_CREATE',
      service: undefined,
      transaction: {
        type: 'PAYMENT',
        amount: { value: 0, currency: 'EUR' },
        description: undefined,
        reference: undefined,
        order: {
          products: [],
        },
      },
    };
    appendLog('Sending : ' + JSON.stringify(message));
    NativeEcrBridge.sendMessage(message).then(() => {
      navigation.dispatch(CommonActions.reset({
        routes: [
          { name: 'Discovery' },
          { name: 'Ecr', params: { terminal: props.route.params.terminal }}
        ]
      }))
    });
  };

  switch (transactionStatus) {
    case 'STARTED':
      return <TransactionStarted handleCancel={transactionStopAction} />;
    case 'PROCESSING':
      return <TransactionProcessing />;
    case 'CANCELLED':
      return <TransactionCancelled goBack={resetBack} />;
    case 'PIN_INPUT_PENDING':
      return <WaitingPinInput />;
    case 'COMPLETED':
      return (
        <TransactionCompleted
          approved={approved}
          payerMessage={payerMessage}
          goBack={resetBack}
          receipt={receipt}
          orderID={orderId}
        />
      );
    case 'QUEUED':
      return <TransactionQueued goBack={resetBack} />;
    case 'PIN_INPUT_ERROR':
    case 'FAILED':
      return <TransactionError goBack={resetBack} />;
  }
};

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NativeEcrBridge, {
  PayNLTransaction,
  PosMessage,
  PosReply,
  PosTerminal,
} from '../../specs/NativeEcrBridge';
import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogs } from '../context/LoggingContext';
import { Product, ProductCard } from '../components/ProductCard';
import { PayButton } from '../components/Button';
import ChevronLeft from '../components/icons/ChevronLeft';
import InfoIcon from '../components/icons/Info';
import type { EventSubscription } from 'react-native/Libraries/vendor/emitter/EventEmitter';

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Cola',
    price: 0.01,
    emoji: '🧃',
  },
  {
    id: 2,
    name: 'Cola Zero',
    price: 3.25,
    emoji: '🧃',
  },
  {
    id: 3,
    name: 'Fanta',
    price: 3.25,
    emoji: '🧃',
  },
  {
    id: 4,
    name: 'Tapbier',
    price: 4.25,
    emoji: '🍺',
  },
  {
    id: 5,
    name: 'Spa rood',
    price: 2.5,
    emoji: '💧',
  },
  {
    id: 6,
    name: 'Bitterballen',
    price: 7.5,
    emoji: '🍔',
  },
  {
    id: 7,
    name: 'Frikandel',
    price: 3.5,
    emoji: '🥩',
  },
  {
    id: 8,
    name: 'Frikandel speciaal',
    price: 51.50,
    emoji: '🥩',
  },
  {
    id: 9,
    name: 'Portie friet',
    price: 6.5,
    emoji: '🍟',
  },
];

type Props = StaticScreenProps<{
  terminal: PosTerminal;
}>;

export function EcrPage(props: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { appendLog } = useLogs();
  const replySubscription = useRef<EventSubscription | undefined>(undefined);

  const [transaction, setTransaction] = useState<PayNLTransaction>({
    amount: { value: 0, currency: 'EUR' },
    description: undefined,
    reference: undefined,
    order: {
      products: [],
    },
  });

  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(PRODUCTS.map(p => [p.id, 0])),
  );

  const changeQty = (id: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }));
  };

  const handleReply = (response: PosReply) => {
    appendLog('Received reply: ' + JSON.stringify(response));

    if (response.type === 'ERROR') {
      navigation.navigate('ErrorView', { message: response.reason || '' });
      return;
    }

    if (response.type === 'TRANSACTION_EVENT' && response.event === 'STARTED') {
      replySubscription.current?.remove();
      replySubscription.current = undefined;
      navigation.navigate('TransactionStatus');

      setTransaction({
        amount: { value: 0, currency: 'EUR' },
        description: undefined,
        reference: undefined,
        order: {
          products: [],
        },
      });
      return;
    }
  };

  const connectAction = (terminal: PosTerminal) => {
    NativeEcrBridge.connect(terminal).then(() => {
      appendLog(`Connected to ${terminal.terminalName}!`);
      orderCreateAction();
    });
  };

  const disconnectAction = () => {
    NativeEcrBridge.disconnect();
    replySubscription.current?.remove();
    replySubscription.current = undefined;
    navigation.goBack();
  };

  const orderCreateAction = () => {
    const message: PosMessage = {
      type: 'ORDER_CREATE',
      service: undefined,
      transaction,
    };
    appendLog('Sending : ' + JSON.stringify(message));
    NativeEcrBridge.sendMessage(message);
  };

  const orderUpdateAction = (transaction: PayNLTransaction) => {
    const message: PosMessage = {
      type: 'ORDER_UPDATE',
      service: undefined,
      transaction,
    };
    appendLog('Sending : ' + JSON.stringify(message));
    NativeEcrBridge.sendMessage(message);
  };

  const orderStartAction = () => {
    const message: PosMessage = {
      type: 'ORDER_START',
    };
    appendLog('Sending : ' + JSON.stringify(message));
    NativeEcrBridge.sendMessage(message);
  };

  useEffect(() => {
    if (Object.keys(quantities).length === 0) {
      return;
    }

    const products = PRODUCTS.filter(x => quantities[x.id]);

    const transactionNew = {
      amount: {
        value: products.reduce(
          (a, b) => a + b.price * 100 * quantities[b.id],
          0,
        ),
        currency: transaction.amount.currency,
      },
      description: transaction.description,
      reference: transaction.reference,
      order: {
        products: products.map(y => ({
          description: y.name,
          price: { value: y.price * 100, currency: 'EUR' },
          quantity: quantities[y.id],
        })),
      },
    };

    orderUpdateAction(transactionNew);
    setTransaction(transactionNew);
  }, [quantities]);

  useEffect(() => {
    if (!props.route?.params?.terminal?.sourceIp) {
      console.log('No sourceIp received');
      return;
    }

    replySubscription.current = NativeEcrBridge.onReply(handleReply);

    const terminal = props.route?.params?.terminal;
    if (NativeEcrBridge.getStatus()) {
      NativeEcrBridge.disconnect().then(() => connectAction(terminal));

      return () => {
        NativeEcrBridge.disconnect();
        replySubscription.current?.remove();
        replySubscription.current = undefined;
      };
    }

    connectAction(terminal);
    return () => {
      NativeEcrBridge.disconnect();
      replySubscription.current?.remove();
      replySubscription.current = undefined;
    };
  }, [props.route?.params?.terminal]);

  const paddedProducts =
    PRODUCTS.length % 2 !== 0 ? [...PRODUCTS, null] : PRODUCTS;

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        flex: 1,
        position: 'relative',
      }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={disconnectAction} style={styles.header}>
          <ChevronLeft />
          <Text style={styles.title}>
            {props.route.params.terminal.terminalName}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('LogViewer')}>
          <InfoIcon />
        </TouchableOpacity>
      </View>
      <FlatList
        data={paddedProducts}
        keyExtractor={(item, index) =>
          item ? String(item.id) : `ghost-${index}`
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          if (!item) return <View style={[styles.card, styles.cardGhost]} />;
          return (
            <ProductCard
              product={item}
              qty={quantities[item.id]}
              onDecrement={() => changeQty(item.id, -1)}
              onIncrement={() => changeQty(item.id, 1)}
            />
          );
        }}
      />

      <View style={styles.buttonWrapper}>
        <PayButton
          text={
            'Start Transaction €' + (transaction.amount.value / 100).toFixed(2)
          }
          onPress={orderStartAction}
        />
      </View>
    </View>
  );
}

const ACCENT = '#E24B4A';
const BORDER = '#E5E5E5';
const styles = StyleSheet.create({
  listContent: {
    padding: 10,
    paddingBottom: 160,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 12,
    gap: 6,
  },
  cardGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  buttonWrapper: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 50,
  },
});

// const pingAction = () => {
//   appendLog('Sending : ' + JSON.stringify({ type: 'PING' }));
//   NativeEcrBridge.sendMessage({ type: 'PING' });
// };
// const transactionStartAction = () => {
//   const message: PosMessage = {
//     type: 'TRANSACTION_START',
//     service: undefined,
//     transaction: {
//       amount: { value: 125, currency: 'EUR' },
//     },
//   };
//   appendLog('Sending : ' + JSON.stringify(message));
//   NativeEcrBridge.sendMessage(message);
// };
//
// const transactionStopAction = () => {
//   const message: PosMessage = {
//     type: 'TRANSACTION_STOP',
//   };
//   appendLog('Sending : ' + JSON.stringify(message));
//   NativeEcrBridge.sendMessage(message);
// };
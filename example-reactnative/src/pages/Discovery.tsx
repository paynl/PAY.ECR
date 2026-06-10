import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import NativeEcrBridge, { PosTerminal } from '../../specs/NativeEcrBridge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PayButton } from '../components/Button';
import { TerminalCard } from "../components/TerminalDetectedCard";

export default function DiscoveryPage() {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();

  const [terminals, setTerminals] = useState<PosTerminal[]>([]);

  useEffect(() => {
    const subscription = NativeEcrBridge.onDiscovered(handleOnDiscover);
    startDiscovering();

    return () => {
      subscription.remove();
      NativeEcrBridge.stopDiscovering();
    };
  }, []);

  const startDiscovering = () => {
    if (!NativeEcrBridge.getIsDiscovering()) {
      NativeEcrBridge.startDiscovering();
    }
  }

  const handleOnDiscover = (result: PosTerminal) => {
    setTerminals(x => {
      const list = [...x, result];
      return list.filter((item, index, arr) =>
        arr.findIndex(t => t.terminalCode === item.terminalCode) === index
      );
    });
  };

  return (
    <View style={{ paddingTop: inset.top }}>
      <View style={styles.header}>
        <Text style={styles.title}>PAY.POS terminals</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={startDiscovering}
          accessibilityLabel="Refresh scan"
          accessibilityRole="button"
        >
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={terminals}
        renderItem={x => (
          <TerminalCard
            terminal={x.item}
            onPress={() => navigation.navigate('Ecr', { terminal: x.item })}
          />
        )}
        keyExtractor={item => item.terminalCode}
        contentContainerStyle={styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 20,
    color: '#555',
    lineHeight: 24,
  },
  container: {
    padding: 20,
    gap: 8,
  },
});

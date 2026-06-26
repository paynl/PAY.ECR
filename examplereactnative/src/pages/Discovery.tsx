import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import NativeEcrBridge, { PosTerminal } from '../../specs/NativeEcrBridge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TerminalCard } from "../components/TerminalDetectedCard";
import { useNetInfo } from '@react-native-community/netinfo';

export default function DiscoveryPage() {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();
  const netInfo = useNetInfo();

  const [terminals, setTerminals] = useState<PosTerminal[]>([]);

  useFocusEffect(useCallback(() => {
    if (NativeEcrBridge.getStatus()) {
      NativeEcrBridge.disconnect();
    }

    const subscription = NativeEcrBridge.onDiscovered(handleOnDiscover);
    startDiscovering();

    return () => {
      subscription.remove();
      NativeEcrBridge.stopDiscovering();
    };
  }, []))

  const startDiscovering = () => {
    if (!NativeEcrBridge.getIsDiscovering()) {
      setTerminals([]);
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

  const terminalSelected = (terminal: PosTerminal) => {
    NativeEcrBridge.stopDiscovering();
    navigation.navigate('Ecr', { terminal });
  }

  const ipAddress = netInfo.details && 'ipAddress' in netInfo.details ? netInfo.details.ipAddress as string : '';
  const subnet = getSubnet(ipAddress);
  return (
    <View style={{ paddingTop: inset.top }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PAY.POS terminals</Text>
          <Text>Scanning on {subnet}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={startDiscovering} accessibilityLabel="Refresh scan" accessibilityRole="button">
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={terminals}
        renderItem={x => <TerminalCard terminal={x.item} onPress={() => terminalSelected(x.item)} />}
        keyExtractor={item => item.terminalCode}
        contentContainerStyle={styles.container}
      />
    </View>
  );
}

function getSubnet(ipAddress: string): string {
  if (ipAddress.length === 0) {
    return ipAddress;
  }

  const parts = ipAddress.split(".");

  // Treat the input as an IPv4 address only if it has exactly 4 octets.
  if (parts.length === 4) {
    parts[parts.length - 1] = "x";
    return parts.join(".");
  }

  return ipAddress;
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

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLogs } from '../../context/LoggingContext';

export function LogViewer() {
  const {logs} = useLogs();

  return (
    <View style={styles.background}>
      <Text style={styles.title}>Terminal Logs</Text>
      <FlatList contentContainerStyle={{ paddingBottom: 20 }} data={logs} renderItem={x => <Text style={styles.text}>{x.item}</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, marginTop: 16 },
  text: { marginBottom: 5, fontSize: 14 },
})
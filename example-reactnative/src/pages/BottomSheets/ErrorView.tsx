import { StyleSheet, Text, View } from 'react-native';
import RedCrossIcon from '../../components/icons/Cross';
import { StaticScreenProps } from '@react-navigation/native';

type Props = StaticScreenProps<{
  message: string;
}>

export function ErrorView(props: Props) {
  return (
    <View style={styles.background}>
      <RedCrossIcon />
      <Text style={styles.title}>Error received</Text>
      <Text style={styles.text}>{props.route.params.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 20, paddingHorizontal: 40 },
  title: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  text: { fontSize: 14, textAlign: 'center' },
});

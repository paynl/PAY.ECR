import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface PayButtonProps {
  text: string;
  onPress?: () => void;
}

export const PayButton = (props: PayButtonProps) => {
  return (
    <TouchableOpacity style={styles.button} onPress={props.onPress}>
      <Text style={styles.text}>{props.text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#585FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { fontSize: 14, color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});

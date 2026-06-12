import { StyleSheet, TextInput, View } from 'react-native';
import { useState } from 'react';
import { TextInputProps } from 'react-native';

interface PayInputProps {
  keyboardType?: TextInputProps['keyboardType'];
  placeholder: string;
  onChangeText: (e: string) => void;
  caretHidden?: boolean;
}

export const PayInput = (props: PayInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
      <TextInput
        style={styles.input}
        keyboardType={props.keyboardType}
        placeholder={props.placeholder}
        placeholderTextColor="#999"
        onChangeText={props.onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden={props.caretHidden}
        returnKeyType="done"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  inputFocused: {
    borderColor: '#585FFF',
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
});
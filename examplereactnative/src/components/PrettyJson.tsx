import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native';

interface PrettyJsonProps {
  data: string;
}

const PrettyJson: React.FC<PrettyJsonProps> = ({ data }) => {
  const json = useMemo(() => {
    try {
      // Try to parse + re-stringify for consistent formatting
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Fallback: show the raw string if it's not valid JSON
      return data;
    }
  }, [data]);

  return (
    <ScrollView style={prettyStyles.scroll} contentContainerStyle={prettyStyles.content} horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
      <ScrollView>
        <Text style={prettyStyles.code}>
          {json.split('\n').map((line, idx) => {
            const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:)/);
            if (keyMatch) {
              const [, indent, key, sep] = keyMatch;
              const rest = line.slice(indent.length + key.length + 2 + sep.length);
              return (
                <Text key={idx}>
                  {indent}
                  <Text style={prettyStyles.key}>"{key}"</Text>
                  <Text style={prettyStyles.punct}>{sep}</Text>
                  <Text style={colorize(rest)}>{rest}</Text>
                  {'\n'}
                </Text>
              );
            }
            return (
              <Text key={idx}>
                <Text style={colorize(line)}>{line}</Text>
                {'\n'}
              </Text>
            );
          })}
        </Text>
      </ScrollView>
    </ScrollView>
  );
};

const colorize = (text: string) => {
  const trimmed = text.trimStart();
  const leading = text.slice(0, text.length - trimmed.length);

  if (trimmed.startsWith('"') || /^[{}\[\],]/.test(trimmed) || /^true|false|null/.test(trimmed)) {
    if (/^"(?:[^"\\]|\\["\\bfnrt\/u]|\\u[0-9a-fA-F]{4})*"$/.test(trimmed)) {
      return prettyStyles.string;
    }
    if (/^(true|false|null)$/.test(trimmed.replace(/,$/, ''))) {
      return prettyStyles.literal;
    }
    if (/^[{}\[\],]$/.test(trimmed)) {
      return prettyStyles.punct;
    }
  }
  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(trimmed.replace(/,$/, ''))) {
    return prettyStyles.number;
  }
  return prettyStyles.text;
};

const prettyStyles = StyleSheet.create({
  scroll: {
    maxHeight: 240,
    backgroundColor: '#f6f8fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0d7de',
    marginTop: 10
  },
  content: {
    padding: 10,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  key: { color: '#0550ae', fontWeight: '600' },
  string: { color: '#0a3069' },
  number: { color: '#953800' },
  literal: { color: '#0550ae' },
  punct: { color: '#57606a' },
  text: { color: '#1f2328' },
});

export default PrettyJson;

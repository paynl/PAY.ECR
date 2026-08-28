import React, { RefObject, useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { LogEntry, useLogs } from '../../context/LoggingContext';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/types';
import { PAYPUSH_URL, PAYPUSH_TOKEN } from '@env';

interface LoggingRequestModel {
  logs: LogEntry[];
  aCode: string;
  supportCode: string;
}

type Props = {
  bottomSheet: RefObject<BottomSheetModal | null>;
};
export function LogViewer(props: Props) {
  const { logs } = useLogs();
  const renderBackdrop = useCallback((x: BottomSheetDefaultBackdropProps) => <BottomSheetBackdrop {...x} disappearsOnIndex={-1} appearsOnIndex={0} />, []);

  const sendLogs = async () => {
    if (!PAYPUSH_URL || !PAYPUSH_TOKEN) {
      console.warn('No API url or token available. Make sure the .env file is available');
      return;
    }

    const body: LoggingRequestModel = {
      logs,
      aCode: 'PAY-ECR',
      supportCode: 'xxxx-xxxx-xxxx',
    };

    const response = await fetch(`${PAYPUSH_URL}/Logging`, {
      body: JSON.stringify(body),
      method: 'POST',
      headers: new Headers({ 'X-API-KEY': PAYPUSH_TOKEN, 'content-type': 'application/json' }),
    });

    console.log('Api response: ' + response.status + ' - ' + (await response.text()));
  };

  return (
    <BottomSheetModal ref={props.bottomSheet} index={0} backdropComponent={renderBackdrop} snapPoints={['75%']} enableDynamicSizing={false}>
      <View style={styles.contentContainer}>
        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
          <Text style={styles.title}>Network Logs</Text>
          {PAYPUSH_URL && PAYPUSH_TOKEN && (
            <TouchableOpacity onPress={sendLogs}>
              <Text>Email logs</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }} data={logs} renderItem={x => <Text style={styles.text}>{x.item.line}</Text>} />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  text: { marginBottom: 5, fontSize: 12, fontFamily: 'ui-monospace' },
});

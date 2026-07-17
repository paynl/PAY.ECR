import React, { RefObject, useCallback } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useLogs } from '../../context/LoggingContext';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/types';

type Props = {
  bottomSheet: RefObject<BottomSheetModal | null>;
};
export function LogViewer(props: Props) {
  const { logs } = useLogs();
  const renderBackdrop = useCallback((x: BottomSheetDefaultBackdropProps) => <BottomSheetBackdrop {...x} disappearsOnIndex={-1} appearsOnIndex={0} />, []);

  return (
    <BottomSheetModal ref={props.bottomSheet} index={0} backdropComponent={renderBackdrop} snapPoints={['75%']} enableDynamicSizing={false}>
      <BottomSheetView style={styles.contentContainer}>
        <Text style={styles.title}>Terminal Logs</Text>
        <FlatList contentContainerStyle={{ paddingBottom: 20 }} data={logs} renderItem={x => <Text style={styles.text}>{x.item}</Text>} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, marginTop: 16 },
  text: { marginBottom: 5, fontSize: 14 },
});
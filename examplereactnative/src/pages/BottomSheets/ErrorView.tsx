import React, { RefObject, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import RedCrossIcon from '../../components/icons/Cross';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/types';

type Props = {
  bottomSheet: RefObject<BottomSheetModal<{ message: string }> | null>;
};

export function ErrorView(props: Props) {
  const renderBackdrop = useCallback((x: BottomSheetDefaultBackdropProps) => <BottomSheetBackdrop {...x} disappearsOnIndex={-1} appearsOnIndex={0} />, []);

  return (
    <BottomSheetModal<{ message: string }>
      ref={props.bottomSheet}
      snapPoints={['50%']}
      index={0}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      children={({data}) => (
        <BottomSheetView style={styles.contentContainer}>
          <RedCrossIcon />
          <Text style={styles.title}>Error received</Text>
          <Text style={styles.text}>{data?.message}</Text>
        </BottomSheetView>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#d32f2f' },
  text: { fontSize: 16, textAlign: 'center', marginTop: 8, color: '#666' },
});

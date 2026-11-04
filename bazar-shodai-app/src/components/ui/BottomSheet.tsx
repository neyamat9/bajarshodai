import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetProps as GorhomBottomSheetProps,
} from '@gorhom/bottom-sheet';
import { useAppTheme } from '@/components/theme/ThemeProvider';

export interface BottomSheetProps extends Omit<GorhomBottomSheetProps, 'children'> {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
}

export const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ children, snapPoints: customSnapPoints, onClose, ...rest }, ref) => {
    const { isDark, colors } = useAppTheme();

    const snapPoints = useMemo(() => customSnapPoints ?? ['50%', '85%'], [customSnapPoints]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onClose}
        backgroundStyle={{
          backgroundColor: isDark ? colors.card : colors.card,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#9dbba6' : '#c3d4b9',
          width: 36,
          height: 4,
        }}
        {...rest}
      >
        <View style={styles.contentContainer}>{children}</View>
      </GorhomBottomSheet>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

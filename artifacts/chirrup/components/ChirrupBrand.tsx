import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';

const LOGO_PATH = 'M21.3338 9.33452H21.3471M2.6656 26.6665L16.9601 6.26781C17.6104 5.33624 18.5413 4.63666 19.617 4.271C20.6928 3.90534 21.8572 3.89271 22.9406 4.23495C24.024 4.5772 24.9699 5.25643 25.6402 6.17367C26.3106 7.09091 26.6705 8.19823 26.6675 9.33428V13.334C26.6675 16.1628 25.5436 18.8758 23.5431 20.876C21.5425 22.8763 18.8292 24 16 24H4.53242M26.6675 9.33428L29.3344 10.0011L26.6675 10.6678M13.3331 24.0003V28M18.6669 23.6669V28M9.3328 23.9998C10.9771 23.9997 12.5814 23.4931 13.9275 22.5488C15.2735 21.6046 16.2959 20.2686 16.8555 18.7227C17.4151 17.1768 17.4847 15.496 17.0548 13.9091C16.625 12.3222 15.7166 10.9063 14.4532 9.85402';

export function ChirrupLogo({ size = 32, color = '#284D3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessibilityLabel="Chirrup bird mark">
      <G>
        <Path d={LOGO_PATH} stroke={color} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

export function ChirrupBrand({ size = 28, showSubtitle = true, style, testID }: { size?: number; showSubtitle?: boolean; style?: ViewStyle; testID?: string }) {
  const c = useColors();
  return (
    <View testID={testID} accessibilityRole="header" accessibilityLabel="Chirrup field studio" style={[s.row, style]}>
      <ChirrupLogo size={size} />
      <Text style={[s.brand, { color: c.foreground, fontSize: Math.round(size * 0.86) }]}>Chirrup</Text>
      {showSubtitle ? <Text style={[s.sub, { color: c.mutedForeground }]}>FIELD STUDIO</Text> : null}
    </View>
  );
}

export default ChirrupBrand;

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: serif },
  sub: { fontFamily: sans.medium, fontSize: 9, letterSpacing: 1.2, marginTop: 4 },
});

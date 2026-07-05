import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { StorageKeys, storage } from '../../../storage/mmkv';
import { useTheme } from '../../../theme/ThemeProvider';
import { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'See your whole financial picture',
    subtitle: 'Expenses, income, and balance — in one clean dashboard.',
  },
  {
    title: 'Log an expense in seconds',
    subtitle: 'Smart defaults, categories, and receipts — no friction.',
  },
  {
    title: 'Understand where money goes',
    subtitle: 'Category breakdowns and trends that actually make sense.',
  },
];

function SlideArt({ index, color }: { index: number; color: string }) {
  const paths = [
    'M20 60h60M30 40h40M25 80h50',
    'M50 20v60M20 50h60',
    'M20 70l20-25 15 15 25-35',
  ];
  return (
    <Svg width={140} height={140} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={46} fill={color} opacity={0.12} />
      <Path d={paths[index]} stroke={color} strokeWidth={5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const finish = () => {
    storage.set(StorageKeys.onboardingDone, true);
    navigation.replace('Login');
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPage, paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <SlideArt index={i} color={theme.colors.brandPrimary} />
            <AppText variant="h1" style={styles.center}>
              {slide.title}
            </AppText>
            <AppText tone="secondary" style={styles.center}>
              {slide.subtitle}
            </AppText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? theme.colors.brandPrimary : theme.colors.borderHairline,
                width: i === index ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={index === SLIDES.length - 1 ? 'Get started' : 'Next'}
          onPress={() => {
            if (index === SLIDES.length - 1) finish();
            else scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  center: { textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 16 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24 },
});

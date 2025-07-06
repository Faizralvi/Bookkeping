import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    PanResponder,
    Text,
    View,
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useLanguage } from '../../app/contexts/LanguageContext';
import { assetAPI, equityAPI, liabilityAPI } from '../../lib/utils/api';

const screenWidth = Dimensions.get('window').width;

type BookkeepingEntry = {
  type: 'asset' | 'liability' | 'equity';
  date: string;
  amount?: string;
  name?: string;
  assetType?: string;
  assetCategory?: string;
  liabilityType?: string;
  liabilityCategory?: string;
  equityType?: string;
  description?: string;
};

// Format besar angka: 1000000 => 1M, 1000000000 => 1B, dll
const formatLargeNumber = (value: number) => {
  if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toString();
};

export const PieDonutSwipeable = forwardRef<{ refresh: () => void }, {}>((props, ref) => {
  const { getTranslation, formatCurrency, currency } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetEntries, setAssetEntries] = useState<BookkeepingEntry[]>([]);
  const [liabilityEntries, setLiabilityEntries] = useState<BookkeepingEntry[]>([]);
  const [equityEntries, setEquityEntries] = useState<BookkeepingEntry[]>([]);

  const slideAnim = useRef(new Animated.Value(1)).current;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetRes, liabilityRes, equityRes] = await Promise.all([
        assetAPI.getAssets(),
        liabilityAPI.getLiabilities(),
        equityAPI.getEquities(),
      ]);
      setAssetEntries(assetRes?.data || []);
      setLiabilityEntries(liabilityRes?.data || []);
      setEquityEntries(equityRes?.data || []);
    } catch {
      setError(getTranslation('errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchData();
    }
  }));

  useEffect(() => {
    fetchData();
  }, []);

  const charts = useMemo(() => {
    // Group assets by assetCategory instead of assetType
    const assetCategories = assetEntries.reduce((acc, entry) => {
      const category = entry.assetCategory || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(entry.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Create asset chart data with dynamic colors
    const assetColors = ['#3b82f6', '#0ea5e9', '#06b6d4', '#0891b2', '#0c4a6e', '#1e40af'];
    const assetChartData = Object.entries(assetCategories).map(([category, total], index) => ({
      label: category,
      value: total,
      color: assetColors[index % assetColors.length],
    }));

    // Group liabilities by liabilityCategory instead of liabilityType
    const liabilityCategories = liabilityEntries.reduce((acc, entry) => {
      const category = entry.liabilityCategory || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(entry.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Group equities by equityType
    const equityCategories = equityEntries.reduce((acc, entry) => {
      const category = entry.equityType || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(entry.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Create liability chart data with dynamic colors
    const liabilityColors = ['#f59e42', '#fbbf24', '#f97316', '#ea580c', '#dc2626', '#b91c1c'];
    const liabilityChartData = Object.entries(liabilityCategories).map(([category, total], index) => ({
      label: category,
      value: total,
      color: liabilityColors[index % liabilityColors.length],
    }));

    // Create equity chart data with dynamic colors
    const equityColors = ['#a855f7', '#6366f1', '#f472b6', '#fbbf24', '#8b5cf6', '#7c3aed'];
    const equityChartData = Object.entries(equityCategories).map(([category, total], index) => ({
      label: category,
      value: total,
      color: equityColors[index % equityColors.length],
    }));

    // Combine liability and equity data for the second chart
    const liabilityEquityChartData = [...liabilityChartData, ...equityChartData];

    return [
      {
        data: assetChartData.map((item) => ({ value: item.value, color: item.color })),
        centerLabel: (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#A1A1AA', fontSize: 14 }}>{getTranslation('totalAssets')}</Text>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22 }}>
              {formatCurrency(assetChartData.reduce((sum, item) => sum + item.value, 0))}
            </Text>
          </View>
        ),
        legend: assetChartData,
      },
      {
        data: liabilityEquityChartData.map((item) => ({ value: item.value, color: item.color })),
        centerLabel: (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#A1A1AA', fontSize: 14 }}>{getTranslation('liabilityEquity') || getTranslation('liabilities') + ' & ' + getTranslation('equity')}</Text>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22 }}>
              {formatCurrency(
                liabilityEquityChartData.reduce((sum, item) => sum + item.value, 0),
              )}
            </Text>
          </View>
        ),
        legend: liabilityEquityChartData,
      },
    ];
  }, [assetEntries, liabilityEntries, equityEntries, getTranslation, currency]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: -(screenWidth - 32) * activeIndex,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 10) setActiveIndex((prev) => Math.max(0, prev - 1));
        else if (gestureState.dx < -10) setActiveIndex((prev) => Math.min(charts.length - 1, prev + 1));
      },
    }),
  ).current;

  if (loading) {
    return <View style={{ height: 240, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  if (error) {
    return (
      <View style={{ height: 240, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>❌</Text>
        <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{getTranslation('errorLoadingData')}</Text>
        <Text style={{ color: '#aaa', fontSize: 14 }}>{error}</Text>
      </View>
    );
  }

  if (charts.length === 0) {
    return (
      <View style={{ height: 240, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>📊</Text>
        <Text style={{ color: '#aaa', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
          {getTranslation('noChartData')}
        </Text>
        <Text style={{ color: '#aaa', fontSize: 14 }}>{getTranslation('noChartDataDetail')}</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#1f1f1f', padding: 16, borderRadius: 20, alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12}}>
        {getTranslation('assetLiabilitySummary')}
      </Text>

      <View style={{ width: screenWidth - 32, overflow: 'hidden' }}>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            flexDirection: 'row',
            width: (screenWidth - 32) * charts.length,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {charts.map((chart, idx) => {
            const total = chart.legend.reduce((sum, i) => sum + i.value, 0);
            if (chart.data.length === 0) {
              return (
                <View key={idx} style={{ width: screenWidth - 32, alignItems: 'center', justifyContent: 'center', height: 240 }}>
                  <Text style={{ color: '#aaa', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                    {getTranslation('noChartData')}
                  </Text>
                  <Text style={{ color: '#aaa', fontSize: 14 }}>Belum ada data untuk chart ini.</Text>
                </View>
              );
            }
            return (
              <View key={idx} style={{ width: screenWidth - 32, alignItems: 'center' }}>
                <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                  <PieChart
                    data={chart.data}
                    donut
                    radius={90}
                    innerRadius={65}
                    showText={false}
                    innerCircleColor={'#232323'}
                    centerLabelComponent={() => chart.centerLabel}
                  />
                </View>
                <View style={{ marginTop: 18, width: '100%', alignItems: 'center' }}>
                  {chart.legend.map((item, idx) => {
                    const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <View
                        key={item.label}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 8,
                          justifyContent: 'center',
                          backgroundColor: 'rgba(255,255,255,0.07)',
                          borderRadius: 10,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          minWidth: 260,
                        }}
                      >
                        <View style={{ width: 15, height: 14, backgroundColor: item.color, borderRadius: 7, marginRight: 8, borderWidth: 2, borderColor: '#fff' }} />
                        <Text style={{ color: '#DED3C4', fontWeight: 'bold', fontSize: 14, flex: 1 }}>{item.label}</Text>
                        <Text style={{ color: '#1DCD9F', fontSize: 14, minWidth: 80, textAlign: 'right' }}>{formatCurrency(item.value)}</Text>
                        <Text style={{ color: '#666', fontWeight: 'bold', fontSize: 14, marginLeft: 10 }}>{percent}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
        {charts.map((_, idx) => (
          <View
            key={idx}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIndex === idx ? '#fff' : '#666',
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>
    </View>
  );
});

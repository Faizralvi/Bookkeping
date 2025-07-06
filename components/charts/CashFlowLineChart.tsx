import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useLanguage } from '../../app/contexts/LanguageContext';
import { assetAPI, equityAPI, incomeAPI, liabilityAPI, spendingAPI } from '../../lib/utils/api';
import { CustomText } from '../CustomText';

/**
 * CashFlow Line Chart Component
 * 
 * Features:
 * - Responsive chart width based on data points
 * - Automatic data aggregation for large datasets (>50 points)
 * - Horizontal scrolling for wide charts
 * - Visual indicator when data is aggregated
 * - Optimized performance for different time periods
 * 
 * Chart Width Logic:
 * - Small datasets (≤30 points): Use screen width
 * - Medium datasets (31-50 points): Proportional width with optimal spacing
 * - Large datasets (>50 points): Aggregated to 12 points with minimum width
 */

const screenWidth = Dimensions.get('window').width;

type ChartDataPoint = {
  date: string;
  cashFlowIn: number;
  cashFlowOut: number;
};

type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
};

const getDateRange = (period: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return { startDate: weekAgo, endDate: today };
    case 'month':
      const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: monthAgo, endDate: today };
    case 'quarter':
      const quarterAgo = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      return { startDate: quarterAgo, endDate: today };
    case 'year':
      const yearAgo = new Date(today.getFullYear(), 0, 1);
      return { startDate: yearAgo, endDate: today };
    default:
      return { startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: today };
  }
};

const processApiData = async (
  startDate: Date,
  endDate: Date,
  incomeData: any[],
  spendingData: any[],
  equityData: any[],
  assetData: any[],
  liabilityData: any[]
): Promise<ChartDataPoint[]> => {
  const data: ChartDataPoint[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayIncome = incomeData.filter((item: any) => {
      const itemDate = new Date(item.incomeDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr;
    }).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const daySpending = spendingData.filter((item: any) => {
      const itemDate = new Date(item.spendDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr;
    }).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const dayEquityIn = equityData.filter((item: any) => {
      const itemDate = new Date(item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr &&
        (item.equityType === 'initial' || item.equityType === 'additional');
    }).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const dayEquityOut = equityData.filter((item: any) => {
      const itemDate = new Date(item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr &&
        item.equityType === 'withdrawal';
    }).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    // Asset logic
    const assetOutCategories = ['bangunan', 'mesin', 'kendaraan', 'peralatan', 'investasi_tetap', 'investasi_lancar'];
    const assetInCategories = ['inventory', 'penghutang', 'deposit'];
    const dayAssetOut = assetData.filter((item: any) => {
      const itemDate = new Date(item.assetDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr && assetOutCategories.includes((item.assetCategory || '').toLowerCase());
    }).reduce((sum: number, item: any) => sum + (Number(item.amount || item.assetValue) || 0), 0);
    const dayAssetIn = assetData.filter((item: any) => {
      const itemDate = new Date(item.assetDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr && assetInCategories.includes((item.assetCategory || '').toLowerCase());
    }).reduce((sum: number, item: any) => sum + (Number(item.amount || item.assetValue) || 0), 0);
    // Liability logic
    const dayLiabilityIn = liabilityData.filter((item: any) => {
      const itemDate = new Date(item.dueDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr && (item.liabilityCategory || '').toLowerCase() === 'bank_loan';
    }).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const dayLiabilityOut = liabilityData.filter((item: any) => {
      const itemDate = new Date(item.dueDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr && (item.liabilityCategory || '').toLowerCase() !== 'bank_loan';
    }).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    data.push({ date: dateStr, cashFlowIn: dayIncome + dayEquityIn + dayAssetIn + dayLiabilityIn, cashFlowOut: daySpending + dayEquityOut + dayAssetOut + dayLiabilityOut });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

function aggregateData(data: ChartDataPoint[], maxPoints: number = 12): { labels: string[], cashFlowIn: number[], cashFlowOut: number[] } {
  if (data.length <= maxPoints) {
    return {
      labels: data.map(d => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      cashFlowIn: data.map(d => d.cashFlowIn),
      cashFlowOut: data.map(d => d.cashFlowOut)
    };
  }
  
  const chunkSize = Math.ceil(data.length / maxPoints);
  const labels: string[] = [];
  const cashFlowIn: number[] = [];
  const cashFlowOut: number[] = [];
  
  for (let i = 0; i < maxPoints; i++) {
    const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length === 0) continue;
    
    const first = new Date(chunk[0].date);
    const last = new Date(chunk[chunk.length - 1].date);
    
    // Format label based on date range
    let label = '';
    if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
      label = `${first.getDate()}-${last.getDate()}/${first.getMonth() + 1}`;
    } else {
      label = `${first.getDate()}/${first.getMonth() + 1}-${last.getDate()}/${last.getMonth() + 1}`;
    }
    
    labels.push(label);
    cashFlowIn.push(chunk.reduce((sum, d) => sum + d.cashFlowIn, 0));
    cashFlowOut.push(chunk.reduce((sum, d) => sum + d.cashFlowOut, 0));
  }
  
  return { labels, cashFlowIn, cashFlowOut };
}

function formatYLabel(y: string) {
  const val = parseInt(y, 10);
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
  return y;
}

const CustomYAxisLabels: React.FC<{ data: number[], height: number }> = ({ data, height }) => {
  if (data.length === 0) return null;
  const maxValue = Math.max(...data);
  const minValue = 0;
  const segments = 3;
  const segmentHeight = height / segments;
  const labels = [];
  for (let i = 0; i <= segments; i++) {
    const value = minValue + (maxValue - minValue) * (i / segments);
    const yPosition = height - (i * segmentHeight);
    labels.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          right: 0,
          top: yPosition - 10,
          alignItems: 'center',
        }}
      >
        <CustomText style={{ color: '#18181b', fontSize: 10, opacity: 0.7 }}>
          {formatYLabel(Math.round(value).toString())}
        </CustomText>
      </View>
    );
  }
  return (
    <View style={{ position: 'absolute', right: 0, top: 0, height, width: 40 }}>
      {labels}
    </View>
  );
};

export const CashFlowLineChart = forwardRef<{ refresh: () => void }, {}>((props, ref) => {
  const { getTranslation, formatCurrency, language } = useLanguage();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Tambahkan state untuk data sumber
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [equityData, setEquityData] = useState<any[]>([]);
  const [assetData, setAssetData] = useState<any[]>([]);
  const [liabilityData, setLiabilityData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all data sumber
      let income: any[] = [];
      let spending: any[] = [];
      let equity: any[] = [];
      let asset: any[] = [];
      let liability: any[] = [];
      try {
        const incomeResponse = await incomeAPI.getIncome();
        income = incomeResponse?.data?.incomes || [];
      } catch (error) { }
      try {
        const spendingResponse = await spendingAPI.getSpending();
        spending = spendingResponse?.data?.spends || [];
      } catch (error) { }
      try {
        const equityResponse = await equityAPI.getEquities();
        equity = Array.isArray(equityResponse?.data) ? equityResponse.data : [];
      } catch (error) { }
      try {
        const assetResponse = await assetAPI.getAssets();
        asset = Array.isArray(assetResponse?.data) ? assetResponse.data : [];
      } catch (error) { }
      try {
        const liabilityResponse = await liabilityAPI.getLiabilities();
        liability = Array.isArray(liabilityResponse?.data) ? liabilityResponse.data : [];
      } catch (error) { }
      setIncomeData(income);
      setSpendingData(spending);
      setEquityData(equity);
      setAssetData(asset);
      setLiabilityData(liability);
      // Proses chartData seperti sebelumnya
      const start = dateRange.startDate || new Date();
      const end = dateRange.endDate || new Date();
      const processedData = await processApiData(start, end, income, spending, equity, asset, liability);
      if (processedData.length === 0) {
        setError('No data available for the selected period. Please check your data or try a different date range.');
      } else {
        setChartData(processedData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load chart data. Please check your internet connection and try again.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchData();
    }
  }));

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Calculate chart width based on data points to prevent excessive width
  const maxDataPoints = 50; // Maximum data points to display
  const minChartWidth = screenWidth - 40; // Minimum chart width with padding
  const maxChartWidth = screenWidth * 2; // Maximum chart width (2x screen width)
  const optimalDataPoints = 30; // Optimal number of data points for good visualization
  
  let processedChartData = chartData;
  let chartWidth = screenWidth;
  
  // If we have too many data points, aggregate them
  if (chartData.length > maxDataPoints) {
    const aggregatedData = aggregateData(chartData, 12);
    processedChartData = aggregatedData.labels.map((label: string, index: number) => ({
      date: label,
      cashFlowIn: aggregatedData.cashFlowIn[index],
      cashFlowOut: aggregatedData.cashFlowOut[index]
    }));
    chartWidth = minChartWidth; // Use minimum width for aggregated data
  } else if (chartData.length > optimalDataPoints) {
    // For moderate data points, use proportional width with better calculation
    const dataPointWidth = Math.max(8, Math.min(15, screenWidth / optimalDataPoints));
    chartWidth = Math.min(maxChartWidth, Math.max(minChartWidth, chartData.length * dataPointWidth));
  } else {
    // For small data points, use screen width
    chartWidth = screenWidth;
  }
  
  const labels = processedChartData.map(d => ''); // label kosong untuk X axis
  const cashFlowIn = processedChartData.map(d => d.cashFlowIn);
  const cashFlowOut = processedChartData.map(d => d.cashFlowOut);
  const totalCashFlowIn = chartData.reduce((sum, d) => sum + d.cashFlowIn, 0);
  const totalCashFlowOut = chartData.reduce((sum, d) => sum + d.cashFlowOut, 0);
  const netCashFlow = totalCashFlowIn - totalCashFlowOut;
  const avgCashFlowIn = chartData.length > 0 ? Math.round(totalCashFlowIn / chartData.length) : 0;
  const avgCashFlowOut = chartData.length > 0 ? Math.round(totalCashFlowOut / chartData.length) : 0;

  const chartConfig = {
    backgroundColor: '#181818',
    backgroundGradientFrom: '#181818',
    backgroundGradientTo: '#181818',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    style: { borderRadius: 1 },
    formatYLabel: () => '',
    propsForBackgroundLines: {
      stroke: '#333',
    },
    yAxisLabel: '',
    yAxisSuffix: '',
    yLabelsOffset: 0,
    horizontalLabelRotation: 0,
    verticalLabelRotation: 0,
    withHorizontalLabels: true,
    withInnerLines: true,
    withDots: true,
    withShadow: false,
    withScrollableDot: false,
    withVerticalLines: false,
    withHorizontalLines: true,
    yAxisInterval: 0,
    yAxisMinInterval: 0,
    yAxisMaxInterval: 0,
  };

  const data = {
    labels,
    datasets: [
      {
        data: cashFlowIn,
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: cashFlowOut,
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const range = getDateRange(period);
    setDateRange(range);
  };

  const formatDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) return '';
    const start = dateRange.startDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const end = dateRange.endDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Hitung breakdown sumber cashflow
  const start = dateRange.startDate || new Date();
  const end = dateRange.endDate || new Date();
  // Filter data sesuai range
  function inRange(date: Date) {
    return date >= start && date <= end;
  }
  // Income
  const totalIncome = incomeData.filter(item => inRange(new Date(item.incomeDate || item.createdAt))).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  // Spending
  const totalSpending = spendingData.filter(item => inRange(new Date(item.spendDate || item.createdAt))).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  // Equity
  const totalEquityIn = equityData.filter(item => inRange(new Date(item.createdAt)) && (item.equityType === 'initial' || item.equityType === 'additional')).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalEquityOut = equityData.filter(item => inRange(new Date(item.createdAt)) && item.equityType === 'withdrawal').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  // Asset
  const assetOutCategories = ['bangunan', 'mesin', 'kendaraan', 'peralatan'];
  const assetInCategories = ['inventory', 'penghutang', 'deposit'];
  const totalAssetOut = assetData.filter(item => inRange(new Date(item.assetDate || item.createdAt)) && assetOutCategories.includes((item.assetCategory || '').toLowerCase())).reduce((sum, item) => sum + (Number(item.amount || item.assetValue) || 0), 0);
  const totalAssetIn = assetData.filter(item => inRange(new Date(item.assetDate || item.createdAt)) && assetInCategories.includes((item.assetCategory || '').toLowerCase())).reduce((sum, item) => sum + (Number(item.amount || item.assetValue) || 0), 0);
  // Liability
  const totalLiabilityIn = liabilityData.filter(item => inRange(new Date(item.dueDate || item.createdAt)) && (item.liabilityCategory || '').toLowerCase() === 'bank_loan').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalLiabilityOut = liabilityData.filter(item => inRange(new Date(item.dueDate || item.createdAt)) && (item.liabilityCategory || '').toLowerCase() !== 'bank_loan').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (loading) {
    return (
      <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CustomText style={{ color: '#fff', fontSize: 16 }}>{getTranslation('loadingChartData')}</CustomText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <Ionicons name="warning-outline" size={48} color="#ff6b6b" style={{ marginBottom: 16 }} />
        <CustomText style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
          {error}
        </CustomText>
        <TouchableOpacity
          onPress={fetchData}
          style={{
            backgroundColor: '#FFC300',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          <CustomText style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>
            {getTranslation('retry') || 'Retry'}
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 2, padding: 0, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      <View style={{ paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0 }}>
        <CustomText style={{ color: '#6b7280', fontSize: 16, marginBottom: 0 }}>
          {getTranslation('netCashFlow') || 'Net Cash Flow'}
        </CustomText>
        <CustomText style={{ color: '#18181b', fontSize: 32, fontWeight: 'bold', marginBottom: 0 }}>
          {formatCurrency(netCashFlow)}
        </CustomText>
       
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <CustomText style={{ color: '#18181b', fontSize: 14, fontWeight: 'bold' }}>
              {getTranslation('filterByDate')}
            </CustomText>
            <CustomText style={{ color: '#6b7280', fontSize: 12 }}>
              {formatDateRange()}
            </CustomText>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {(() => {
              let periodLabels: { key: string; label: string }[];
              if (language === 'id') {
                periodLabels = [
                  { key: 'today', label: 'H' },
                  { key: 'week', label: '7H' },
                  { key: 'month', label: 'B' },
                  { key: 'quarter', label: '3B' },
                  { key: 'year', label: 'T' },
                ];
              } else if (language === 'ms') {
                periodLabels = [
                  { key: 'today', label: 'H' },
                  { key: 'week', label: '3H' },
                  { key: 'month', label: 'B' },
                  { key: 'quarter', label: '3B' },
                  { key: 'year', label: 'T' },
                ];
              } else {
                periodLabels = [
                  { key: 'today', label: 'D' },
                  { key: 'week', label: '7D' },
                  { key: 'month', label: 'M' },
                  { key: 'quarter', label: '3M' },
                  { key: 'year', label: 'Y' },
                ];
              }
              return periodLabels.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  onPress={() => handlePeriodChange(period.key)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: selectedPeriod === period.key ? '#FFC300' : '#f3f4f6',
                    borderWidth: 1,
                    borderColor: selectedPeriod === period.key ? '#FFC300' : '#e5e7eb',
                    marginRight: 6,
                    marginBottom: 6,
                  }}
                >
                  <CustomText style={{
                    color: selectedPeriod === period.key ? '#18181b' : '#18181b',
                    fontSize: 12,
                    fontWeight: selectedPeriod === period.key ? 'bold' : 'normal',
                  }}>
                    {period.label}
                  </CustomText>
                </TouchableOpacity>
              ));
            })()}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              style={{
                flex: 1,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#18181b" style={{ marginRight: 4 }} />
              <CustomText style={{ color: '#18181b', fontSize: 12 }}>
                {dateRange.startDate ? dateRange.startDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : getTranslation('startCustom')}
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowEndDatePicker(true)}
              style={{
                flex: 1,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="#18181b" style={{ marginRight: 4 }} />
              <CustomText style={{ color: '#18181b', fontSize: 12 }}>
                {dateRange.endDate ? dateRange.endDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : getTranslation('endCustom')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'relative', 
          marginHorizontal: 0, 
          marginTop: 0, 
          marginBottom: 0, 
          padding: 0,
          overflow: 'hidden'
        }}>
          {chartData.length > maxDataPoints && (
            <View style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(255, 195, 0, 0.9)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              zIndex: 1
            }}>
              <CustomText style={{ color: '#18181b', fontSize: 10, fontWeight: 'bold' }}>
                {getTranslation('dataAggregated') || 'Data Aggregated'}
              </CustomText>
            </View>
          )}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={chartWidth > screenWidth}
            contentContainerStyle={{ minWidth: chartWidth }}
          >
            <LineChart
              data={data}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                backgroundColor: 'white',
                backgroundGradientFrom: 'white',
                backgroundGradientTo: 'white',
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(24,24,27,${opacity})`,
              }}
              fromZero
              withInnerLines={false}
              withHorizontalLabels={true}
              withDots={processedChartData.length <= 30} // Only show dots for smaller datasets
              withVerticalLabels={true}
              withVerticalLines={processedChartData.length <= 30} // Only show vertical lines for smaller datasets
              withHorizontalLines={false}
              segments={5}
              formatYLabel={(value) => `${parseInt(value) / 1000}K`}
              style={{ 
                marginVertical: 0, 
                borderRadius: 0, 
                backgroundColor: 'white', 
                padding: 0, 
                margin: 0,
                minWidth: chartWidth
              }}
              bezier
            />
          </ScrollView>
          {/* <View style={{ position: 'absolute', right: 0, top: 0, height: 220, width: 40, justifyContent: 'center', margin: 0, padding: 0 }}>
            <CustomYAxisLabels data={[...cashFlowIn, ...cashFlowOut]} height={220} />
          </View> */}
        </View>
        <View style={{ backgroundColor: '#f3f4f6', borderRadius: 16, padding: 16, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="trending-up" size={20} color="#22c55e" style={{ marginRight: 8 }} />
            <CustomText style={{ color: '#18181b', fontWeight: 'bold', fontSize: 16 }}>
              {getTranslation('cashFlowSummary') || 'Cash Flow Summary'}
            </CustomText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <View>
              <CustomText style={{ color: '#22c55e', fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(totalCashFlowIn)}</CustomText>
              <CustomText style={{ color: '#6b7280', fontSize: 12 }}>{getTranslation('totalCashFlowIn') || 'Total Cash In'}</CustomText>
            </View>
            <View>
              <CustomText style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(totalCashFlowOut)}</CustomText>
              <CustomText style={{ color: '#6b7280', fontSize: 12 }}>{getTranslation('totalCashFlowOut') || 'Total Cash Out'}</CustomText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <View>
              <CustomText style={{ color: '#18181b', fontSize: 16, fontWeight: 'bold' }}>{formatCurrency(avgCashFlowIn)}</CustomText>
              <CustomText style={{ color: '#6b7280', fontSize: 12 }}>{getTranslation('avgCashFlowIn') || 'Avg Cash In'}</CustomText>
            </View>
            <View>
              <CustomText style={{ color: '#18181b', fontSize: 16, fontWeight: 'bold' }}>{formatCurrency(avgCashFlowOut)}</CustomText>
              <CustomText style={{ color: '#6b7280', fontSize: 12 }}>{getTranslation('avgCashFlowOut') || 'Avg Cash Out'}</CustomText>
            </View>
          </View>
        </View>
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginTop: 24 }}>
          <CustomText style={{ color: '#18181b', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
            Breakdown Cashflow
          </CustomText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <CustomText style={{ color: '#6b7280', fontSize: 13, flex: 1 }}>Sumber</CustomText>
            <CustomText style={{ color: '#22c55e', fontSize: 13, flex: 1, textAlign: 'right' }}>Cash In</CustomText>
            <CustomText style={{ color: '#ef4444', fontSize: 13, flex: 1, textAlign: 'right' }}>Cash Out</CustomText>
          </View>
          {/* Income */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, alignItems: 'center' }}>
            <Ionicons name="cash-outline" size={16} color="#22c55e" style={{ width: 20 }} />
            <CustomText style={{ color: '#18181b', flex: 1 }}>Income</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalIncome)}</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>-</CustomText>
          </View>
          {/* Asset */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={16} color="#3b82f6" style={{ width: 20 }} />
            <CustomText style={{ color: '#18181b', flex: 1 }}>Asset</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalAssetIn)}</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalAssetOut)}</CustomText>
          </View>
          {/* Equity */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={16} color="#f59e42" style={{ width: 20 }} />
            <CustomText style={{ color: '#18181b', flex: 1 }}>Equity</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalEquityIn)}</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalEquityOut)}</CustomText>
          </View>
          {/* Liability */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, alignItems: 'center' }}>
            <Ionicons name="card-outline" size={16} color="#a855f7" style={{ width: 20 }} />
            <CustomText style={{ color: '#18181b', flex: 1 }}>Liability</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalLiabilityIn)}</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalLiabilityOut)}</CustomText>
          </View>
          {/* Spending */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, alignItems: 'center' }}>
            <Ionicons name="remove-circle-outline" size={16} color="#ef4444" style={{ width: 20 }} />
            <CustomText style={{ color: '#18181b', flex: 1 }}>Spending</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>-</CustomText>
            <CustomText style={{ color: '#18181b', flex: 1, textAlign: 'right' }}>{formatCurrency(totalSpending)}</CustomText>
          </View>
        </View>
        {showStartDatePicker && (
          <DateTimePicker
            value={dateRange.startDate || new Date()}
            mode="date"
            display="default"
            onChange={(e, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setDateRange(prev => ({ ...prev, startDate: selectedDate }));
                setSelectedPeriod('custom');
              }
            }}
            maximumDate={dateRange.endDate || undefined}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={dateRange.endDate || new Date()}
            mode="date"
            display="default"
            onChange={(e, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setDateRange(prev => ({ ...prev, endDate: selectedDate }));
                setSelectedPeriod('custom');
              }
            }}
            minimumDate={dateRange.startDate || undefined}
          />
        )}
      </View>
    </View>
  );
});

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useLanguage } from '../../app/contexts/LanguageContext';
import { incomeAPI, spendingAPI } from '../../lib/utils/api';
import { CustomText } from '../CustomText';

const screenWidth = Dimensions.get('window').width;

type ChartDataPoint = {
  date: string;
  netProfit: number;
  income: number;
  expense: number;
};

type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
};

// Helper function to get date range for quick filters
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

// Function to process API data and generate chart data
const processApiData = (incomeData: any[], expenseData: any[], startDate: Date, endDate: Date): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Filter income data for this date
    const dayIncomeItems = incomeData.filter((item: any) => {
      const itemDate = new Date(item.incomeDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr;
    });
    
    const dayIncome = dayIncomeItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    
    // Calculate EBITDA (tax from income) for this date
    const dayEBITDA = dayIncomeItems.reduce((sum: number, item: any) => {
      const amount = Number(item.amount || 0);
      const taxPercentage = Number(item.incomeTax || 0);
      return sum + (amount * (taxPercentage / 100));
    }, 0);
    
    // Filter expense data for this date
    const dayExpense = expenseData.filter((item: any) => {
      const itemDate = new Date(item.spendDate || item.createdAt);
      return itemDate.toISOString().split('T')[0] === dateStr;
    }).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    
    // Net Profit = Gross Profit (Income) - Expense - EBITDA (tax from income)
    const netProfit = dayIncome - dayExpense - dayEBITDA;
    
    data.push({ 
      date: dateStr, 
      netProfit, 
      income: dayIncome, 
      expense: dayExpense 
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
};

function aggregateToFiveBars(data: ChartDataPoint[]): { labels: string[], netProfit: number[] } {
  const bars = 5;
  const chunkSize = Math.ceil(data.length / bars);
  const labels: string[] = [];
  const netProfit: number[] = [];

  for (let i = 0; i < bars; i++) {
    const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length === 0) continue;
    const last = new Date(chunk[chunk.length - 1].date);
    // Only show the last date in the range
    labels.push(`${last.getDate()}/${last.getMonth() + 1}`);
    netProfit.push(chunk.reduce((sum, d) => sum + d.netProfit, 0));
  }
  return { labels, netProfit };
}

function formatYLabel(y: string) {
  const val = parseInt(y, 10);
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
  return y;
}

// Custom Y-axis labels component
const CustomYAxisLabels: React.FC<{ data: number[], height: number }> = ({ data, height }) => {
  if (data.length === 0) return null;
  
  const maxValue = Math.max(...data);
  const minValue = 0;
  const segments = 5;
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
          alignItems: 'flex-end',
        }}
      >
        <CustomText style={{ color: '#fff', fontSize: 10, opacity: 0.7 }}>
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

export const NetProfitChart = forwardRef<{ refresh: () => void }, {}>((props, ref) => {
  const { getTranslation, formatCurrency } = useLanguage();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const start = dateRange.startDate || new Date();
      const end = dateRange.endDate || new Date();
      
      // Fetch data from API
      const [incomeResponse, expenseResponse] = await Promise.all([
        incomeAPI.getIncome(),
        spendingAPI.getSpending()
      ]);
      
      // Extract data arrays from API responses
      const incomeData = incomeResponse?.data?.incomes || [];
      const expenseData = expenseResponse?.data?.spends || [];
      
      // Process the data for the chart
      const processedData = processApiData(incomeData, expenseData, start, end);
      setChartData(processedData);
      
    } catch (err: any) {
      console.error('Error fetching chart data:', err);
      setError(err.message || 'Failed to load chart data');
      // Fallback to empty data
      setChartData([]);
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
  }, [dateRange]);

  const { labels, netProfit } = chartData.length > 0 ? aggregateToFiveBars(chartData) : { labels: ['No Data'], netProfit: [0] };

  if (netProfit.length === 1) {
    labels.push('');
    netProfit.push(0);
  }

  // Calculate summary
  const totalNetProfit = chartData.reduce((sum, d) => sum + d.netProfit, 0);
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);
  const avgNetProfit = chartData.length > 0 ? Math.round(totalNetProfit / chartData.length) : 0;

  const chartConfig = {
    backgroundColor: '#181818',
    backgroundGradientFrom: '#181818',
    backgroundGradientTo: '#181818',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 195, 0, ${opacity})`, // yellow bar
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    style: { borderRadius: 16 },
    formatYLabel: () => '', // Return empty string to hide Y-axis labels
    barPercentage: 0.6,
    propsForBackgroundLines: {
      stroke: '#333',
    },
    // Hide default Y-axis labels completely
    yAxisLabel: '',
    yAxisSuffix: '',
    yLabelsOffset: 0,
    horizontalLabelRotation: 0,
    verticalLabelRotation: 0,
    // Hide Y-axis labels on the left
    withVerticalLabels: true,
    withHorizontalLabels: true,
    withInnerLines: true,
    withDots: false,
    withShadow: false,
    withScrollableDot: false,
    withVerticalLines: false,
    withHorizontalLines: true,
    // Disable Y-axis labels
    yAxisInterval: 0,
    yAxisMinInterval: 0,
    yAxisMaxInterval: 0,
  };

  const data = {
    labels,
    datasets: [
      {
        data: netProfit,
        color: (opacity = 1) => `rgba(255, 195, 0, ${opacity})`,
      },
    ],
    legend: [getTranslation('netProfit') || 'Net Profit'],
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

  if (loading) {
    return (
      <View style={{ backgroundColor: '#181818', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CustomText style={{ color: '#fff', fontSize: 16 }}>{getTranslation('loadingChartData')}</CustomText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ backgroundColor: '#181818', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CustomText style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center' }}>{getTranslation('errorWithMessage').replace('{msg}', error)}</CustomText>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#181818', borderRadius: 20, padding: 20, marginBottom: 24 }}>
      {/* Header angka besar */}
      <CustomText style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 4 }}>
        {formatCurrency(totalNetProfit)}
      </CustomText>
      <CustomText style={{ color: '#aaa', fontSize: 16, marginBottom: 16 }}>
        {getTranslation('netProfit')}
      </CustomText>

      {/* Date Filter Buttons */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <CustomText style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
            {getTranslation('filterByDate')}
          </CustomText>
          <CustomText style={{ color: '#aaa', fontSize: 12 }}>
            {formatDateRange()}
          </CustomText>
        </View>
        
        {/* Quick Filter Buttons */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {[
            { key: 'today', label: getTranslation('today') },
            { key: 'week', label: getTranslation('week') },
            { key: 'month', label: getTranslation('month') },
            { key: 'quarter', label: getTranslation('quarter') },
            { key: 'year', label: getTranslation('year') },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              onPress={() => handlePeriodChange(period.key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: selectedPeriod === period.key ? '#FFC300' : 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: selectedPeriod === period.key ? '#FFC300' : 'rgba(255,255,255,0.2)',
              }}
            >
              <CustomText style={{
                color: selectedPeriod === period.key ? '#000' : '#fff',
                fontSize: 12,
                fontWeight: selectedPeriod === period.key ? 'bold' : 'normal',
              }}>
                {period.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Date Range Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowStartDatePicker(true)}
            style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
            <CustomText style={{ color: '#fff', fontSize: 12 }}>
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
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
            <CustomText style={{ color: '#fff', fontSize: 12 }}>
              {dateRange.endDate ? dateRange.endDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : getTranslation('endCustom')}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bar Chart with Custom Y-axis labels on the right */}
      <View style={{ position: 'relative' }}>
        <BarChart
          data={data}
          width={screenWidth - 88} // Reduced width to make room for Y-axis labels
          height={220}
          chartConfig={chartConfig}
          fromZero
          withInnerLines
          withHorizontalLabels
          withVerticalLabels
          showBarTops
          showValuesOnTopOfBars={false}
          segments={7}
          yAxisLabel={''}
          yAxisSuffix={''}
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
        {/* Custom Y-axis labels on the right */}
        <CustomYAxisLabels data={netProfit} height={220} />
      </View>

      {/* Ringkasan bulanan */}
      <View style={{ backgroundColor: '#222', borderRadius: 16, padding: 16, marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="trophy" size={20} color="#FFC300" style={{ marginRight: 8 }} />
          <CustomText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {getTranslation('monthlySummary')}
          </CustomText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <CustomText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(totalNetProfit)}</CustomText>
            <CustomText style={{ color: '#aaa', fontSize: 12 }}>{getTranslation('totalNetProfit')}</CustomText>
          </View>
          <View>
            <CustomText style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(avgNetProfit)}</CustomText>
            <CustomText style={{ color: '#aaa', fontSize: 12 }}>{getTranslation('avgNetProfit')}</CustomText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View>
            <CustomText style={{ color: '#22c55e', fontSize: 16, fontWeight: 'bold' }}>{formatCurrency(totalIncome)}</CustomText>
            <CustomText style={{ color: '#aaa', fontSize: 12 }}>{getTranslation('totalIncome')}</CustomText>
          </View>
          <View>
            <CustomText style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold' }}>{formatCurrency(totalExpense)}</CustomText>
            <CustomText style={{ color: '#aaa', fontSize: 12 }}>{getTranslation('totalExpense')}</CustomText>
          </View>
        </View>
      </View>

      {/* Date pickers */}
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
  );
});
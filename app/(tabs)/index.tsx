import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { NetProfitChart } from '../../components/charts/NetProfitLineChart';
import { incomeAPI, spendingAPI, userAPI } from '../../lib/utils/api';
import { logout } from '../../lib/utils/auth';
import { Language, useLanguage } from '../contexts/LanguageContext';

export default function SummaryTab() {
  const router = useRouter();
  const navigation = useNavigation();
  const { getTranslation, language, setLanguage, formatCurrency, currency, setCurrency } = useLanguage();

  const [totalIncome, setTotalIncome] = React.useState(0);
  const [totalExpense, setTotalExpense] = React.useState(0);
  const [netProfit, setNetProfit] = React.useState(0);
  const [lastMonthIncome, setLastMonthIncome] = React.useState(0);
  const [lastMonthExpense, setLastMonthExpense] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState<string | null>(null);

  // Helper function to get current month start and end dates
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return getTranslation('greetingMorning');
    if (hour < 18) return getTranslation('greetingAfternoon');
    return getTranslation('greetingEvening');
  };
  

  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { startOfMonth, endOfMonth };
  };

  // Helper function to get previous month start and end dates
  const getPreviousMonthRange = () => {
    const now = new Date();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { startOfPrevMonth, endOfPrevMonth };
  };

  // Helper function to filter data by date range
  const filterDataByDateRange = (data: any[], startDate: Date, endDate: Date) => {
    return data.filter((item: any) => {
      const itemDate = new Date(item.incomeDate || item.spendDate || item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const incomeData = await incomeAPI.getIncome();
      const expenseData = await spendingAPI.getSpending();

      const incomes = incomeData?.data?.incomes || [];
      const expenses = expenseData?.data?.spends || [];

      // Get date ranges
      const { startOfMonth, endOfMonth } = getCurrentMonthRange();
      const { startOfPrevMonth, endOfPrevMonth } = getPreviousMonthRange();

      // Filter current month data
      const currentMonthIncomes = filterDataByDateRange(incomes, startOfMonth, endOfMonth);
      const currentMonthExpenses = filterDataByDateRange(expenses, startOfMonth, endOfMonth);

      // Filter previous month data
      const previousMonthIncomes = filterDataByDateRange(incomes, startOfPrevMonth, endOfPrevMonth);
      const previousMonthExpenses = filterDataByDateRange(expenses, startOfPrevMonth, endOfPrevMonth);

      // Calculate totals
      const currentMonthIncomeTotal = currentMonthIncomes.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const currentMonthExpenseTotal = currentMonthExpenses.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const previousMonthIncomeTotal = previousMonthIncomes.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const previousMonthExpenseTotal = previousMonthExpenses.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      // Calculate net profit using new logic: Gross Profit - Expense - EBITDA (tax from income)
      const currentMonthEBITDA = currentMonthIncomes.reduce((sum: number, item: any) => {
        const amount = Number(item.amount || 0);
        const taxPercentage = Number(item.incomeTax || 0);
        return sum + (amount * (taxPercentage / 100));
      }, 0);
      const currentMonthNetProfit = currentMonthIncomeTotal - currentMonthExpenseTotal - currentMonthEBITDA;

      const previousMonthEBITDA = previousMonthIncomes.reduce((sum: number, item: any) => {
        const amount = Number(item.amount || 0);
        const taxPercentage = Number(item.incomeTax || 0);
        return sum + (amount * (taxPercentage / 100));
      }, 0);
      const previousMonthNetProfit = previousMonthIncomeTotal - previousMonthExpenseTotal - previousMonthEBITDA;

      setTotalIncome(currentMonthIncomeTotal);
      setTotalExpense(currentMonthExpenseTotal);
      setNetProfit(currentMonthNetProfit);
      setLastMonthIncome(previousMonthIncomeTotal);
      setLastMonthExpense(previousMonthExpenseTotal);
    } catch (err: any) {
      setError(err.message || getTranslation('errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const profile = await userAPI.getProfile();
      console.log('Profile response:', profile);
      if (profile && profile.data && profile.data.name) {
        setFirstName(profile.data.name.split(' ')[0]);
      }
    } catch (err) {
      console.log('Profile fetch error:', err);
      setFirstName(null);
    }
  };

  // Initial data fetch
  React.useEffect(() => {
    fetchSummary();
    fetchProfile();
  }, []);

  // Refresh data when page is focused (like donut chart)
  useFocusEffect(
    React.useCallback(() => {
      fetchSummary();
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      alert(getTranslation('errorLoginFailed'));
    }
  };

  React.useEffect(() => {
    navigation.setOptions({
      title: '',
      headerStyle: {
        backgroundColor: 'white',
        elevation: 0,         // Android
        shadowOpacity: 0,     // iOS
        borderBottomWidth: 0, // Optional (iOS) to remove line
      },
      headerTitleStyle: { color: 'black', fontWeight: 'bold' },
      headerTitleAlign: 'left',
      headerTintColor: 'black',
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginLeft: 15 }}>
          <Ionicons name="person-circle-outline" size={35} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          {['id', 'ms', 'en'].map((lang) => {
            const isSelected = language === lang;
            return (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang as Language)}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 4,
                  borderRadius: 6,
                  backgroundColor: isSelected ? 'black' : 'white',
                  borderWidth: 0,
                  borderColor: '#d4d4d8',
                }}
              >
                <CustomText
                  style={{
                    color: isSelected ? 'white' : 'black',
                    fontSize: 12,
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }}
                >
                  {lang.toUpperCase()}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </View>
      )
      
    });
  }, [navigation, language]);
  
  const renderChangeText = (current: number, previous: number, type: 'income' | 'expense') => {
    const diff = current - previous;
    const percentage = previous === 0 ? 0 : (diff / previous) * 100;
    const rounded = percentage.toFixed(1);
    if (percentage > 0) {
      return getTranslation('changeUp').replace('{x}', rounded);
    }
    if (percentage < 0) {
      return getTranslation('changeDown').replace('{x}', Math.abs(+rounded).toString());
    }
    return getTranslation('changeNoChange');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 -mt-[25px] mb-[50px]">
        <View className="p-4">

          {/* Greeting for Accounting App */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <CustomText className="text-[15px] font-semibold text-[#393E46] pb-[3px]">
                {getGreeting()} 
              </CustomText>
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <CustomText className="text-[12px] font-medium text-gray-600">
                  {currency}
                </CustomText>
              </View>
            </View>
            <CustomText className="text-[50px] font-bold text-[#18181b] mb-1">
              {firstName ? `${firstName}` : ''}
            </CustomText>
            
          </View>


          {/* Summary Cards */}
          <View className="flex-row flex-wrap justify-between mb-6">
            {/* Income */}
            <View className="w-[48%] bg-[#1f1f1f] rounded-2xl p-4 relative">
              <TouchableOpacity
                className="absolute right-2 top-2 w-8 h-8 items-center justify-center"
                onPress={() => router.push({ pathname: '/modals/entry-type-list', params: { type: 'income' } })}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}
              >
                <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
              </TouchableOpacity>
              <CustomText className="text-xs text-white mb-1">
                {getTranslation('income') || 'Pendapatan'}
              </CustomText>
              <CustomText className="text-2xl font-bold text-[#22c55e] mb-1">
                {formatCurrency(totalIncome)}
              </CustomText>
              <CustomText className="text-[10px] text-white">{renderChangeText(totalIncome, lastMonthIncome, 'income')}</CustomText>
            </View>

            {/* Expense */}
            <View className="w-[48%] bg-[#1f1f1f] rounded-2xl p-4 relative">
              <TouchableOpacity
                className="absolute right-2 top-2 w-8 h-8 items-center justify-center"
                onPress={() => router.push({ pathname: '/modals/entry-type-list', params: { type: 'expense' } })}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}
              >
                <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
              </TouchableOpacity>
              <CustomText className="text-xs text-white mb-1">
                {getTranslation('expense') || 'Pengeluaran'}
              </CustomText>
              <CustomText className="text-2xl font-bold text-[#ef4444] mb-1">
                {formatCurrency(totalExpense)}
              </CustomText>
              <CustomText className="text-[10px] text-white">{renderChangeText(totalExpense, lastMonthExpense, 'expense')}</CustomText>
            </View>

            {/* Net Profit */}
            <View className="w-full bg-[#1f1f1f] rounded-2xl p-4 mt-4 flex-row justify-between items-center">
              <View>
                <CustomText className="text-xs text-white mb-1">
                  {getTranslation('netProfit') || 'Untung Bersih'}
                </CustomText>
                <CustomText
                  className="text-2xl font-bold"
                  style={{ color: netProfit > 0 ? '#22c55e' : netProfit < 0 ? '#ef4444' : 'white' }}
                >
                  {formatCurrency(netProfit)}
                </CustomText>
              </View>
              <Ionicons
                name={netProfit > 0 ? 'trending-up' : netProfit < 0 ? 'trending-down' : 'remove-outline'}
                size={26}
                color={netProfit > 0 ? '#22c55e' : netProfit < 0 ? '#ef4444' : 'white'}
              />
            </View>
          </View>

          {/* Chart */}
          <NetProfitChart />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

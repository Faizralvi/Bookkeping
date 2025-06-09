import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { getEntries } from '../../lib/utils/storage';

// Define BookkeepingEntry type here if not exported from storage
// Remove this if you export BookkeepingEntry from storage.ts

type BookkeepingEntry = {
  type: 'income' | 'expense' | 'asset' | 'liability' | 'equity';
  date: string;
  mainIncome?: string;
  sideIncome?: string;
  period?: string;
  amount?: string;
  category?: string;
  description?: string;
  receipt?: {
    name: string;
    type: string;
    size: number;
    uri: string;
  } | null;
  name?: string;
  value?: string;
  assetType?: string;
  liabilityType?: string;
};

const screenWidth = Dimensions.get('window').width;

// Entry types with icons and colors
const ENTRY_TYPES = [

  { label: 'Pendapatan', value: 'income', icon: 'arrow-up-outline', color: '#22c55e' },
  { label: 'Pengeluaran', value: 'expense', icon: 'arrow-down-outline', color: '#ef4444' },
  { label: 'Aset', value: 'asset', icon: 'cube-outline', color: '#3b82f6' },
  { label: 'Liabiliti', value: 'liability', icon: 'git-branch-outline', color: '#f59e42' },
  { label: 'Ekuiti', value: 'equity', icon: 'people-outline', color: '#a855f7' },
];

// Kategori untuk cashflow/expense
const CATEGORIES = [
  { label: 'Umum', value: 'umum', icon: 'flag-outline', color: '#3b82f6' },
  { label: 'Transfer', value: 'transfer', icon: 'swap-horizontal-outline', color: '#0ea5e9' },
  { label: 'Piutang', value: 'piutang', icon: 'document-text-outline', color: '#f59e42' },
  { label: 'Makanan', value: 'makanan', icon: 'fast-food-outline', color: '#b45309' },
  { label: 'Transportasi', value: 'transportasi', icon: 'car-outline', color: '#ef4444' },
  { label: 'Elektronik', value: 'elektronik', icon: 'phone-portrait-outline', color: '#e11d48' },
  { label: 'Kas', value: 'kas', icon: 'flag-outline', color: '#3b82f6' },
];

export default function DashboardScreen() {
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const data = await getEntries();
    setEntries(data || []);
  };

  // Summary
  const totalMainIncome = entries.filter(e => e.type === 'income' && (e.category === 'main' || e.mainIncome)).reduce((sum, e) => sum + (e.category === 'main' ? Number(e.amount || 0) : Number(e.mainIncome || 0)), 0);
  const totalSideIncome = entries.filter(e => e.type === 'income' && (e.category === 'side' || e.sideIncome)).reduce((sum, e) => sum + (e.category === 'side' ? Number(e.amount || 0) : Number(e.sideIncome || 0)), 0);
  const totalIncome = totalMainIncome + totalSideIncome;
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;
  const totalAssets = entries.filter(e => e.type === 'asset').reduce((sum, e) => sum + Number(e.value || 0), 0);
  const totalLiabilities = entries.filter(e => e.type === 'liability').reduce((sum, e) => sum + Number(e.value || 0), 0);
  const totalEquity = entries.filter(e => e.type === 'equity').reduce((sum, e) => sum + Number(e.value || 0), 0);

  // Cashflow chart data (dummy grouping by month)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
  const incomeByMonth = [2000000, 4500000, 2800000, 8000000, 9900000, 4300000];
  const expenseByMonth = [1000000, 2000000, 1500000, 3000000, 4000000, 2000000];
  const chartData = {
    labels: months,
    datasets: [
      {
        data: incomeByMonth,
        color: (opacity = 1) => `rgba(34,197,94,${opacity})`,
        strokeWidth: 2,
      },
      {
        data: expenseByMonth,
        color: (opacity = 1) => `rgba(239,68,68,${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Pendapatan', 'Pengeluaran'],
  };

  // Filtered entries for list
  const filteredEntries = entries.filter((item) =>
    selectedType === null ? true : item.type === selectedType
  ).sort((a, b) => (b.date > a.date ? 1 : -1));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <CustomText className="text-2xl font-bold text-center mb-4">Summary</CustomText>

          {/* Summary Section */}
          <View className="bg-[#232323] rounded-2xl p-5 mb-6">
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#2e2e2e] rounded-xl p-4 items-center">
                  <Ionicons name="arrow-up" size={22} color="#22c55e" />
                  <CustomText className="text-xs text-white mt-1">Pendapatan</CustomText>
                  <CustomText className="text-lg font-bold text-[#22c55e]" numberOfLines={1} ellipsizeMode="tail">Rp {typeof totalIncome === 'number' ? totalIncome.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : totalIncome}</CustomText>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#2e2e2e] rounded-xl p-4 items-center">
                  <Ionicons name="arrow-down" size={22} color="#ef4444" />
                  <CustomText className="text-xs text-white mt-1">Pengeluaran</CustomText>
                  <CustomText className="text-lg font-bold text-[#ef4444]" numberOfLines={1} ellipsizeMode="tail">Rp {typeof totalExpense === 'number' ? totalExpense.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : totalExpense}</CustomText>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#2e2e2e] rounded-xl p-4 items-center">
                  <Ionicons name="wallet" size={22} color="#22c55e" />
                  <CustomText className="text-xs text-white mt-1">Untung Bersih</CustomText>
                  <CustomText className="text-lg font-bold text-[#22c55e]" numberOfLines={1} ellipsizeMode="tail">Rp {typeof netProfit === 'number' ? netProfit.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : netProfit}</CustomText>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#2e2e2e] rounded-xl p-4 items-center">
                  <Ionicons name="cube" size={22} color="#3b82f6" />
                  <CustomText className="text-xs text-white mt-1">Aset</CustomText>
                  <CustomText className="text-lg font-bold text-[#3b82f6]" numberOfLines={1} ellipsizeMode="tail">Rp {typeof totalAssets === 'number' ? totalAssets.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : totalAssets}</CustomText>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#2e2e2e] rounded-xl p-4 items-center">
                  <Ionicons name="git-branch" size={22} color="#f59e42" />
                  <CustomText className="text-xs text-white mt-1">Liabiliti</CustomText>
                  <CustomText className="text-lg font-bold text-[#f59e42]" numberOfLines={1} ellipsizeMode="tail">Rp {typeof totalLiabilities === 'number' ? totalLiabilities.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : totalLiabilities}</CustomText>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-[#2e2e2e] rounded-xl p-4 items-center">
                  <Ionicons name="people" size={22} color="#a855f7" />
                  <CustomText className="text-xs text-white mt-1">Ekuiti</CustomText>
                  <CustomText className="text-lg font-bold text-[#a855f7]" numberOfLines={1} ellipsizeMode="tail">Rp {typeof totalEquity === 'number' ? totalEquity.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : totalEquity}</CustomText>
                </View>
              </View>
            </View>
          </View>

{/* Cashflow Chart */}
<View className="bg-[#232323] p-4 rounded-2xl mb-6">
  <CustomText className="text-lg font-semibold mb-4 text-white">
    Grafik Aliran Tunai
  </CustomText>
  <LineChart
    data={chartData}
    width={screenWidth - 48}
    height={180}
    chartConfig={{
      backgroundColor: '#232323',
      backgroundGradientFrom: '#232323',
      backgroundGradientTo: '#232323',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // garis biru
      labelColor: (opacity = 1) => `rgba(209,213,219,${opacity})`, // label abu muda
      style: {
        borderRadius: 12,
      },
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: '#22c55e', // dot hijau terang
      },
      propsForBackgroundLines: {
        stroke: '#444', // garis grid lebih gelap
      },
    }}
    bezier
    style={{
      marginVertical: 4,
      borderRadius: 12,
    }}
    withInnerLines={false}
    withOuterLines={false}
    withShadow={false}
  />
</View>

          {/* ENTRY_TYPES Card List */}
          <View className="bg-white rounded-2xl shadow-sm mb-[70px]">
            {ENTRY_TYPES.map((type, idx) => (
              <TouchableOpacity
                key={type.value}
                className={`flex-row items-center px-4 py-4 ${idx !== ENTRY_TYPES.length - 1 ? 'border-b border-gray-100' : ''}`}
                onPress={() => router.push({ pathname: '/modals/entry-type-list', params: { type: type.value } })}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: type.color + '22' }}>
                  <Ionicons name={type.icon as any} size={26} color={type.color} />
                </View>
                <CustomText className="flex-1 text-base font-semibold text-gray-800">{type.label}</CustomText>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

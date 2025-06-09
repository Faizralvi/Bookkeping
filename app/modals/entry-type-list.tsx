import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { getEntries } from '../../lib/utils/storage';

// Tipe data
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
  dueDate?: string;
  lender?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  tax?: number;
};

// Kategori untuk income
const INCOME_CATEGORIES = {
  main: 'Main Income',
  side: 'Side Income'
};

// Kategori untuk expense
const EXPENSE_CATEGORIES = {
  salary: 'Gaji',
  utilities: 'Bil Utiliti',
  transport: 'Minyak/Pengangkutan',
  packaging: 'Kos Pembungkusan',
  advertising: 'Iklan',
  license: 'Yuran Lesen',
  rent: 'Sewa',
  others: 'Lain-lain'
};

const EQUITY_TYPES = {
  initial: 'Modal Awal / Modal Disetor',
  retained: 'Laba Ditahan',
  withdrawal: 'Prive',
  additional: 'Tambahan Modal Disetor'
};

const ASSET_TYPES = {
  current: 'Aset Lancar',
  fixed: 'Aset Tetap'
};

function formatNumberShort(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'M';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'Jt';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'Rb';
  return num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export default function EntryTypeListScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { type } = route.params as { type: BookkeepingEntry['type'] };
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredEntries, setFilteredEntries] = useState<BookkeepingEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: getTypeLabel(type),
      headerStyle: { backgroundColor: '#232323' },
      headerTitleStyle: { color: 'white', fontWeight: 'bold' },
      headerTitleAlign: 'center',
      headerTintColor: 'white',
    });
    loadEntries();
  }, [navigation, type]);

  useEffect(() => {
    let filtered = entries;
    
    // Filter berdasarkan kategori untuk income dan expense
    if ((type === 'income' || type === 'expense') && selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filter berdasarkan pencarian untuk asset, liability, dan equity
    if ((type === 'asset' || type === 'liability' || type === 'equity') && searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.name?.toLowerCase().includes(query)) ||
        (item.description?.toLowerCase().includes(query))
      );
    }

    // Filter berdasarkan tanggal
    if (startDate || endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        return true;
      });
    }
    
    setFilteredEntries(filtered);
  }, [selectedCategory, entries, searchQuery, type, startDate, endDate]);

  const loadEntries = async () => {
    const data = await getEntries();
    const filteredData = data ? data.filter((item: BookkeepingEntry) => item.type === type) : [];
    setEntries(filteredData);
    setFilteredEntries(filteredData);
  };

  function getTypeLabel(type: string) {
    switch(type) {
      case 'income': return 'Pendapatan';
      case 'expense': return 'Pengeluaran';
      case 'asset': return 'Aset';
      case 'liability': return 'Liabiliti';
      case 'equity': return 'Ekuiti';
      default: return '';
    }
  }

  function getCategoryLabel(item: BookkeepingEntry) {
    if (item.type === 'income') {
      return INCOME_CATEGORIES[item.category as keyof typeof INCOME_CATEGORIES] || 'Unknown';
    } else if (item.type === 'expense') {
      return EXPENSE_CATEGORIES[item.category as keyof typeof EXPENSE_CATEGORIES] || 'Unknown';
    } else if (item.type === 'equity') {
      return EQUITY_TYPES[item.category as keyof typeof EQUITY_TYPES] || 'Unknown';
    } else if (item.type === 'asset') {
      return ASSET_TYPES[item.category as keyof typeof ASSET_TYPES] || 'Unknown';
    }
    return '';
  }

  const renderCategoryFilters = () => {
    if (type !== 'income' && type !== 'expense') return null;

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
      <View className="flex-row items-center space-x-2 mb-4">
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg border items-center justify-center ${
            selectedCategory === null ? 'bg-black border-black' : 'bg-white border-gray-300'
          }`}
          onPress={() => setSelectedCategory(null)}
        >
          <CustomText className={`font-medium ${selectedCategory === null ? 'text-white' : 'text-black'}`}>Semua</CustomText>
        </TouchableOpacity>
        {Object.entries(categories).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            className={`px-4 py-2 rounded-lg border items-center justify-center ${
              selectedCategory === value ? 'bg-black border-black' : 'bg-white border-gray-300'
            }`}
            onPress={() => setSelectedCategory(value)}
          >
            <CustomText className={`font-medium ${selectedCategory === value ? 'text-white' : 'text-black'}`}>{label}</CustomText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSearchBar = () => {
    if (type !== 'asset' && type !== 'liability' && type !== 'equity') return null;

    return (
      <View className="mb-4">
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-2"
          placeholder="Cari nama atau deskripsi..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    );
  };

  const renderDateFilter = () => {
    return (
      <View className="mb-4">
        <CustomText className="text-gray-600 mb-2">Filter Tanggal</CustomText>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 border border-gray-300 rounded-lg p-2 flex-row items-center"
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <CustomText className="ml-2 text-gray-600">
              {startDate ? startDate.toLocaleDateString('id-ID') : 'Tanggal Mulai'}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 border border-gray-300 rounded-lg p-2 flex-row items-center"
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <CustomText className="ml-2 text-gray-600">
              {endDate ? endDate.toLocaleDateString('id-ID') : 'Tanggal Akhir'}
            </CustomText>
          </TouchableOpacity>
        </View>
        {(startDate || endDate) && (
          <TouchableOpacity
            className="mt-2 bg-red-500 rounded-lg p-2"
            onPress={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            <CustomText className="text-white text-center">Reset Filter Tanggal</CustomText>
          </TouchableOpacity>
        )}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
                // Jika endDate lebih kecil dari startDate, reset endDate
                if (endDate && selectedDate > endDate) {
                  setEndDate(null);
                }
              }
            }}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            minimumDate={startDate || undefined}
            onChange={(_, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        )}
      </View>
    );
  };

  const renderSummary = () => {
    if (type !== 'income' && type !== 'expense') return null;

    const total = filteredEntries.reduce((sum, item) => {
      const amount = Number(item.amount || item.mainIncome || item.sideIncome || 0);
      return sum + amount;
    }, 0);

    // Untuk summary tambahan jika income
    let grossProfit = total;
    let ebitda = total;
    let netProfit = total;
    if (type === 'income') {
      // Ambil semua expense dari entries (bukan filteredEntries)
      const allExpenses = entries.filter(e => e.type === 'expense');
      const cogs = allExpenses.filter(e => e.category === 'packaging' || e.category === 'others').reduce((sum, e) => sum + Number(e.amount || 0), 0);
      grossProfit = total - cogs;
      // EBITDA = Gross Profit - (semua expense kecuali pajak, bunga, depresiasi, amortisasi)
      // Anggap expense category 'salary','utilities','transport','advertising','license','rent' sebagai OPEX
      const opex = allExpenses.filter(e => ['salary','utilities','transport','advertising','license','rent'].includes(e.category || '')).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      ebitda = grossProfit - opex;
      // Pajak dari income
      const totalTax = filteredEntries.reduce((sum, item) => sum + (Number(item.amount || 0) * (Number(item.tax || 0) / 100)), 0);
      netProfit = ebitda - totalTax;
    }

    return (
      <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <View className="flex-row justify-between items-center">
          <CustomText className="text-gray-600">{type === 'income' ? 'Net Profit' : 'Total Pengeluaran'}</CustomText>
          <CustomText className={`font-bold text-lg ${type === 'income' ? 'text-green-600' : 'text-red-600'}`} numberOfLines={1} ellipsizeMode="tail">
            {type === 'income' ? '+Rp ' + formatNumberShort(netProfit) : '-Rp ' + formatNumberShort(total)}
          </CustomText>
        </View>
        {type === 'income' && (
          <View className="mt-2 space-y-1">
            <CustomText className="text-gray-600 text-sm">Gross Profit: <CustomText className="font-bold text-black">Rp {formatNumberShort(grossProfit)}</CustomText></CustomText>
            <CustomText className="text-gray-600 text-sm">EBITDA: <CustomText className="font-bold text-black">Rp {formatNumberShort(ebitda)}</CustomText></CustomText>
          </View>
        )}
        {selectedCategory && (
          <View className="mt-2">
            <CustomText className="text-gray-500 text-sm">
              Kategori: {getCategoryLabel({ type, category: selectedCategory } as BookkeepingEntry)}
            </CustomText>
          </View>
        )}
        {(startDate || endDate) && (
          <View className="mt-1">
            <CustomText className="text-gray-500 text-sm">
              Periode: {startDate ? startDate.toLocaleDateString('id-ID') : 'Awal'} - {endDate ? endDate.toLocaleDateString('id-ID') : 'Akhir'}
            </CustomText>
          </View>
        )}
      </View>
    );
  };

  // Fungsi untuk menghapus entry
  const handleDelete = async (indexToDelete: number) => {
    // Cari index di entries asli, bukan filteredEntries
    const entryToDelete = filteredEntries[indexToDelete];
    const originalIndex = entries.findIndex((entry) => entry === entryToDelete);
    // Hapus dari entries (state utama)
    const updatedEntries = entries.filter((_, idx) => idx !== originalIndex);
    setEntries(updatedEntries);
    // Hapus dari storage
    await AsyncStorage.setItem('@bookkeeping_entries', JSON.stringify(updatedEntries));
    // Update filteredEntries
    setFilteredEntries(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        <CustomText className="text-2xl font-bold text-center mb-4">{getTypeLabel(type)}</CustomText>
        {renderDateFilter()}
        {renderCategoryFilters()}
        {renderSearchBar()}
        {renderSummary()}
        <FlatList
          data={filteredEntries}
          keyExtractor={(_, index) => index.toString()}
          ListEmptyComponent={<CustomText className="text-gray-400 text-center mt-4">Tidak ada data</CustomText>}
          renderItem={({ item, index }) => (
            <View className="flex-row items-center bg-white rounded-xl border border-gray-200 mb-3 p-3">
              <View className="w-10 h-10 bg-gray-200 rounded-lg mr-3 items-center justify-center flex">
                <Ionicons
                  name={
                    item.type === 'income' ? 'arrow-up' :
                    item.type === 'expense' ? 'arrow-down' :
                    item.type === 'asset' ? 'cube' :
                    item.type === 'liability' ? 'git-branch' :
                    'people'
                  }
                  size={20}
                  color={
                    item.type === 'income' ? '#22c55e' :
                    item.type === 'expense' ? '#ef4444' :
                    item.type === 'asset' ? '#3b82f6' :
                    item.type === 'liability' ? '#f59e42' :
                    '#a855f7'
                  }
                />
              </View>
              <View className="flex-1 min-w-0">
                {(item.type === 'income' || item.type === 'expense') ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {getCategoryLabel(item)}
                    </CustomText>
                    <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                      {new Date(item.date).toLocaleDateString('id-ID')}
                    </CustomText>
                    {item.description && <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">{item.description}</CustomText>}
                  </>
                ) : item.type === 'asset' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </CustomText>
                    <View className="flex-row items-center mt-1">
                      <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                        {getCategoryLabel(item)}
                      </CustomText>
                      <CustomText className="text-gray-500 text-sm mx-1" numberOfLines={1} ellipsizeMode="tail">•</CustomText>
                      <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                        {new Date(item.date).toLocaleDateString('id-ID')}
                      </CustomText>
                    </View>
                    {item.description && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {item.description}
                      </CustomText>
                    )}
                  </>
                ) : item.type === 'liability' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </CustomText>
                    <View className="flex-row items-center mt-1">
                      <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                        {new Date(item.date).toLocaleDateString('id-ID')}
                      </CustomText>
                      {item.dueDate && (
                        <>
                          <CustomText className="text-gray-500 text-sm mx-1" numberOfLines={1} ellipsizeMode="tail">•</CustomText>
                          <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                            Jatuh Tempo: {new Date(item.dueDate).toLocaleDateString('id-ID')}
                          </CustomText>
                        </>
                      )}
                    </View>
                    {item.lender && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        Pemberi: {item.lender}
                      </CustomText>
                    )}
                    {item.paymentStatus && (
                      <View className="mt-1">
                        <CustomText className={`text-sm ${
                          item.paymentStatus === 'paid' ? 'text-green-600' :
                          item.paymentStatus === 'partial' ? 'text-yellow-600' :
                          'text-red-600'
                        }`} numberOfLines={1} ellipsizeMode="tail">
                          Status: {
                            item.paymentStatus === 'paid' ? 'Lunas' :
                            item.paymentStatus === 'partial' ? 'Sebagian' :
                            'Belum Dibayar'
                          }
                        </CustomText>
                      </View>
                    )}
                  </>
                ) : item.type === 'equity' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </CustomText>
                    <View className="flex-row items-center mt-1">
                      <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                        {getCategoryLabel(item)}
                      </CustomText>
                      <CustomText className="text-gray-500 text-sm mx-1" numberOfLines={1} ellipsizeMode="tail">•</CustomText>
                      <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                        {new Date(item.date).toLocaleDateString('id-ID')}
                      </CustomText>
                    </View>
                    {item.description && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {item.description}
                      </CustomText>
                    )}
                  </>
                ) : (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </CustomText>
                    <CustomText className="text-gray-500 text-sm" numberOfLines={1} ellipsizeMode="tail">
                      {new Date(item.date).toLocaleDateString('id-ID')}
                    </CustomText>
                    {item.description && <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">{item.description}</CustomText>}
                  </>
                )}
              </View>
              <View className="flex-row items-center">
                {item.type === 'income' && (
                  <CustomText className="ml-1 font-bold text-green-600" numberOfLines={1} ellipsizeMode="tail">
                    +Rp {formatNumberShort(Number(item.amount || item.mainIncome || item.sideIncome || 0))}
                  </CustomText>
                )}
                {item.type === 'expense' && (
                  <CustomText className="ml-1 font-bold text-red-600" numberOfLines={1} ellipsizeMode="tail">
                    -Rp {formatNumberShort(Number(item.amount || 0))}
                  </CustomText>
                )}
                {item.type === 'asset' && (
                  <CustomText className="ml-1 font-bold text-blue-600" numberOfLines={1} ellipsizeMode="tail">
                    Rp {formatNumberShort(Number(item.value || 0))}
                  </CustomText>
                )}
                {item.type === 'liability' && (
                  <CustomText className="ml-1 font-bold text-yellow-600" numberOfLines={1} ellipsizeMode="tail">
                    Rp {formatNumberShort(Number(item.value || 0))}
                  </CustomText>
                )}
                {item.type === 'equity' && (
                  <CustomText className={`ml-1 font-bold ${item.category === 'withdrawal' ? 'text-red-600' : 'text-purple-600'}`} numberOfLines={1} ellipsizeMode="tail">
                    {item.category === 'withdrawal' ? '-' : '+'}Rp {formatNumberShort(Number(item.value || 0))}
                  </CustomText>
                )}
                <TouchableOpacity onPress={() => handleDelete(index)} className="ml-2">
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
} 
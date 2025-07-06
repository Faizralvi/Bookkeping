import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { assetAPI, equityAPI, incomeAPI, liabilityAPI, spendingAPI } from '../../lib/utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import EditEntryModal from './EditEntryModal';


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
  assetName?: string;
  value?: string;
  assetType?: string;
  liabilityType?: 'short-term' | 'long-term';
  dueDate?: string;
  lender?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  tax?: number;
  incomeTax?: number;
  id?: string;
  currency?: string;
};

// Kategori untuk income
const INCOME_CATEGORIES = {
  main: 'main',
  side: 'side',
};

// Kategori untuk expense
const EXPENSE_CATEGORIES = {
  salary: 'salary',
  utilities: 'utilities',
  transport: 'transport',
  packaging: 'packaging',
  advertising: 'advertising',
  license: 'license',
  rent: 'rent',
  others: 'others',
};

const EQUITY_TYPES = {
  initial: 'initial',
  retained: 'retained',
  withdrawal: 'withdrawal',
  additional: 'additional',
};

const ASSET_TYPES = {
  current: 'current',
  fixed: 'fixed',
};

// Kategori asset in/out untuk penyesuaian warna amount
const assetOutCategories = ['bangunan', 'mesin', 'kendaraan', 'peralatan', 'investasi_tetap', 'investasi_lancar'];
const assetInCategories = ['inventory', 'penghutang', 'deposit'];

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
  const [selectedLiabilityTerm, setSelectedLiabilityTerm] = useState<BookkeepingEntry['liabilityType'] | null>(null);
  const [filteredEntries, setFilteredEntries] = useState<BookkeepingEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const { getTranslation, formatCurrency, language, setLanguage, currency, setCurrency } = useLanguage();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editEntry, setEditEntry] = useState<BookkeepingEntry | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerStyle: {
        backgroundColor: 'white',
        elevation: 0,         // Android
        shadowOpacity: 0,     // iOS
        borderBottomWidth: 0, // Optional (iOS) to remove line
      },
      headerTitleStyle: { color: 'white', fontWeight: 'bold' },
      headerTitleAlign: 'center',
      headerTintColor: 'black',
    });
    loadEntries();
  }, [navigation, type]);

  useEffect(() => {
    let filtered = entries;
    
    // Filter by category for income and expense
    if ((type === 'income' || type === 'expense') && selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filter by term for liability
    if (type === 'liability' && selectedLiabilityTerm) {
      filtered = filtered.filter(item => item.liabilityType === selectedLiabilityTerm);
    }
    
    // Filter by search for asset, liability, and equity
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
  }, [selectedCategory, selectedLiabilityTerm, entries, searchQuery, type, startDate, endDate]);

  const loadEntries = async () => {
    console.log('loadEntries called for type:', type);
    try {
      let response: any;
      switch (type) {
        case 'income':
          response = await incomeAPI.getIncome();
          break;
        case 'expense':
          response = await spendingAPI.getSpending();
          break;
        case 'asset':
          response = await assetAPI.getAssets();
          break;
        case 'liability':
          response = await liabilityAPI.getLiabilities();
          break;
        case 'equity':
          response = await equityAPI.getEquities();
          break;
        default:
          return;
      }
  
      console.log('API response received:', response);
  
      // Safely extract data array from the response
      let listData: any[] = [];
      
      if (type === 'income') {
        // Income response: { status, message, data: { incomes: [[Object], [Object], ...] } }
        listData = Array.isArray(response?.data?.incomes) ? response.data.incomes : [];
      } else if (type === 'expense') {
        // Spending response: { status, message, data: { spends: [[Object], [Object], ...] } }
        listData = Array.isArray(response?.data?.spends) ? response.data.spends : [];
      } else if (type === 'equity') {
        // Equity response: { status, message, data: [...] }
        listData = Array.isArray(response?.data) ? response.data : [];
      } else {
        // Asset and Liability: { status, message, data: [...] }
        listData = Array.isArray(response?.data) ? response.data : [];
      }

      console.log('Extracted data:', listData);
      const safeData = Array.isArray(listData) ? listData : [];
      console.log('Safe data to be transformed:', safeData);

      const transformedData = safeData.map((item: any) => {
        console.log('Transforming item:', item);
        console.log('Item incomeTax:', item.incomeTax, 'Type:', typeof item.incomeTax);
        
        if (type === 'income') {
          const id = item.incomeId || item.id;
          if (!id || isNaN(Number(id))) {
            console.warn('Invalid income ID:', id);
            return null;
          }
          const transformedItem = {
            id: String(id),
            type: 'income',
            date: item.createdAt,
            category: item.type,
            amount: item.amount,
            description: item.description,
            tax: item.tax,
            incomeTax: item.incomeTax ? Number(item.incomeTax) : undefined,
            currency: (item && item.currency) ? item.currency : (currency || 'IDR')
          };
          console.log('Transformed income item:', transformedItem);
          return transformedItem;
        } else if (type === 'expense') {
          const id = item.spendId || item.id;
          if (!id || isNaN(Number(id))) {
            console.warn('Invalid expense ID:', id);
            return null;
          }
          return {
            id: String(id),
            type: 'expense',
            date: item.createdAt,
            category: item.spendingType,
            amount: item.amount,
            description: item.description,
            currency: (item && item.currency) ? item.currency : (currency || 'IDR')
          };
        } else if (type === 'asset') {
          const id = item.assetId || item.id;
          if (!id || isNaN(Number(id))) {
            console.warn('Invalid asset ID:', id);
            return null;
          }
          return {
            id: String(id),
            type: 'asset',
            name: item.assetCategory || '',
            assetName: item.assetName || '',
            value: item.amount,
            assetType: item.assetType || '',
            category: item.assetCategory || '',
            date: item.assetDate || item.createdAt || '',
            description: item.description || '',
            currency: (item && item.currency) ? item.currency : (currency || 'IDR')
          };
        } else if (type === 'liability') {
          const id = item.liabilityId || item.id;
          if (!id || isNaN(Number(id))) {
            console.warn('Invalid liability ID:', id);
            return null;
          }
          return {
            id: String(id),
            type: 'liability',
            name: item.description,
            value: item.amount,
            category: item.liabilityCategory,
            liabilityType: item.liabilityType,
            date: item.createdAt,
            description: item.description,
            dueDate: item.dueDate,
            paymentStatus: item.paymentStatus,
            currency: (item && item.currency) ? item.currency : (currency || 'IDR')
          };
        } else if (type === 'equity') {
          const id = item.equityId || item.id;
          if (!id || isNaN(Number(id))) {
            console.warn('Invalid equity ID:', id);
            return null;
          }
          return {
            id: String(id),
            type: 'equity',
            name: item.equityName || '',
            value: item.amount,
            category: item.equityType,
            date: item.equityDate || item.createdAt,
            description: item.description,
            currency: (item && item.currency) ? item.currency : (currency || 'IDR')
          };
        }
        return item;
      }).filter(Boolean);

      setEntries(transformedData);
      setFilteredEntries(transformedData);
      setRefresh(r => !r);
      console.log('loadEntries finished', transformedData.length);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Gagal memuat data. Silakan coba lagi.');
    }
  };

  function getTypeLabel(type: string) {
    switch(type) {
      case 'income': return getTranslation('income');
      case 'expense': return getTranslation('expense');
      case 'asset': return getTranslation('asset');
      case 'liability': return getTranslation('liability');
      case 'equity': return getTranslation('equity');
      default: return '';
    }
  }

  function getCategoryLabel(item: BookkeepingEntry) {
    if (item.type === 'income') {
      return getTranslation(INCOME_CATEGORIES[item.category as keyof typeof INCOME_CATEGORIES] || 'main');
    } else if (item.type === 'expense') {
      return getTranslation(EXPENSE_CATEGORIES[item.category as keyof typeof EXPENSE_CATEGORIES] || 'others');
    } else if (item.type === 'equity') {
      return getTranslation(EQUITY_TYPES[item.category as keyof typeof EQUITY_TYPES] || 'initial');
    } else if (item.type === 'asset') {
      return getTranslation(ASSET_TYPES[item.category as keyof typeof ASSET_TYPES] || 'current');
    }
    return '';
  }

  const renderLiabilityTermFilters = () => {
    if (type !== 'liability') return null;

    const terms: { label: string; value: BookkeepingEntry['liabilityType'] }[] = [
      { label: 'Jangka Pendek', value: 'short-term' },
      { label: 'Jangka Panjang', value: 'long-term' },
    ];

    return (
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
          <TouchableOpacity
            className={`px-5 py-2 rounded-2xl border items-center justify-center mr-2 shadow-sm ${
              selectedLiabilityTerm === null ? 'bg-black border-black' : 'bg-white border-gray-200'
            }`}
            activeOpacity={0.8}
            onPress={() => setSelectedLiabilityTerm(null)}
          >
            <CustomText className={`font-medium ${selectedLiabilityTerm === null ? 'text-white' : 'text-black'}`}>Semua Tipe</CustomText>
          </TouchableOpacity>
          {terms.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              className={`px-5 py-2 rounded-2xl border items-center justify-center mr-2 shadow-sm ${
                selectedLiabilityTerm === value ? 'bg-black border-black' : 'bg-white border-gray-200'
              }`}
              activeOpacity={0.8}
              onPress={() => setSelectedLiabilityTerm(value)}
            >
              <CustomText className={`font-medium ${selectedLiabilityTerm === value ? 'text-white' : 'text-black'}`}>{label}</CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCategoryFilters = () => {
    if (type !== 'income' && type !== 'expense') return null;
  
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
    return (
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
          <TouchableOpacity
            className={`px-5 py-2 rounded-2xl border items-center justify-center mr-2 shadow-sm ${
              selectedCategory === null ? 'bg-black border-black' : 'bg-white border-gray-200'
            }`}
            activeOpacity={0.8}
            onPress={() => setSelectedCategory(null)}
          >
            <CustomText className={`font-medium ${selectedCategory === null ? 'text-white' : 'text-black'}`}>Semua</CustomText>
          </TouchableOpacity>
          {Object.entries(categories).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              className={`px-5 py-2 rounded-2xl border items-center justify-center mr-2 shadow-sm ${
                selectedCategory === value ? 'bg-black border-black' : 'bg-white border-gray-200'
              }`}
              activeOpacity={0.8}
              onPress={() => setSelectedCategory(value)}
            >
              <CustomText className={`font-medium ${selectedCategory === value ? 'text-white' : 'text-black'}`}>{label}</CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  

  const renderSearchBar = () => {
    if (type !== 'asset' && type !== 'liability' && type !== 'equity') return null;

    return (
      <View className="mb-4">
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-2"
          placeholder={getTranslation('searchNameOrDesc')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    );
  };

  const renderDateFilter = () => {
    return (
      <View className="mb-4">
        <CustomText className="text-gray-600 mb-2">{getTranslation('filterByDate')}</CustomText>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 border border-gray-300 rounded-2xl p-2 flex-row items-center bg-white shadow-sm"
            activeOpacity={0.8}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <CustomText className="ml-2 text-gray-600">
              {startDate ? startDate.toLocaleDateString('id-ID') : getTranslation('startDate')}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 border border-gray-300 rounded-2xl p-2 flex-row items-center bg-white shadow-sm"
            activeOpacity={0.8}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <CustomText className="ml-2 text-gray-600">
              {endDate ? endDate.toLocaleDateString('id-ID') : getTranslation('endDate')}
            </CustomText>
          </TouchableOpacity>
        </View>
        {(startDate || endDate) && (
          <TouchableOpacity
            className="mt-2 bg-red-500 rounded-2xl p-2 shadow-sm"
            activeOpacity={0.8}
            onPress={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            <CustomText className="text-white text-center">{getTranslation('resetDateFilter')}</CustomText>
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
    let ebitda = 0;
    let netProfit = total;
    if (type === 'income') {
      // Laba Kotor = Jumlah semua income (sudah benar)
      grossProfit = total;
      
      // EBITDA = Persentase tax dari jumlah semua transaksi
      // Misal transaksi 1000 dengan incomeTax 10% = 100, lalu ditambah transaksi lain
      ebitda = filteredEntries.reduce((sum, item) => {
        const amount = Number(item.amount || item.mainIncome || item.sideIncome || 0);
        const taxPercentage = Number(item.incomeTax || 0);
        return sum + (amount * (taxPercentage / 100));
      }, 0);
      
      // Net Profit = Laba Kotor - EBITDA
      netProfit = grossProfit - ebitda;
    }

    return (
      <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <View className="flex-row justify-between items-center">
          <CustomText className="text-gray-600">{getTranslation(type === 'income' ? 'netProfit' : 'totalExpense')}</CustomText>
          <CustomText className={`font-bold text-lg ${type === 'income' ? 'text-green-600' : 'text-red-600'}`} numberOfLines={1} ellipsizeMode="tail">
            {type === 'income' ? '+' + formatCurrency(netProfit) : '-' + formatCurrency(total)}
          </CustomText>
        </View>
        {type === 'income' && (
          <View className="mt-2 space-y-1">
            <CustomText className="text-gray-600 text-sm">{getTranslation('grossProfit')}: <CustomText className="font-bold text-black">{formatCurrency(grossProfit)}</CustomText></CustomText>
            <CustomText className="text-gray-600 text-sm">{getTranslation('ebitda')}: <CustomText className="font-bold text-black">{formatCurrency(ebitda)}</CustomText></CustomText>
          </View>
        )}
        {selectedCategory && (
          <View className="mt-2">
            <CustomText className="text-gray-500 text-sm">
              {getTranslation('category')}: {getCategoryLabel({ type, category: selectedCategory } as BookkeepingEntry)}
            </CustomText>
          </View>
        )}
        {(startDate || endDate) && (
          <View className="mt-1">
            <CustomText className="text-gray-500 text-sm">
              {getTranslation('period')}: {startDate ? startDate.toLocaleDateString('id-ID') : 'Awal'} - {endDate ? endDate.toLocaleDateString('id-ID') : 'Akhir'}
            </CustomText>
          </View>
        )}
      </View>
    );
  };

  // Fungsi untuk menghapus entry
  const handleDelete = async (indexToDelete: number) => {
    try {
      const entryToDelete = filteredEntries[indexToDelete];
      if (!entryToDelete) {
        Alert.alert('Error', getTranslation('notFound'));
        return;
      }
      Alert.alert(
        getTranslation('confirmDelete'),
        `Apakah Anda yakin ingin menghapus ${getTypeLabel(entryToDelete.type)} ini?`,
        [
          {
            text: getTranslation('cancel'),
            style: 'cancel',
          },
          {
            text: getTranslation('delete'),
            style: 'destructive',
            onPress: async () => {
              // Optimistic UI: remove from state first
              const prevEntries = [...entries];
              const prevFiltered = [...filteredEntries];
              const newEntries = entries.filter(e => e.id !== entryToDelete.id);
              const newFiltered = filteredEntries.filter((_, i) => i !== indexToDelete);
              setEntries(newEntries);
              setFilteredEntries(newFiltered);
              setRefresh(r => !r);
              try {
                let response;
                if (!entryToDelete.id) {
                  // Rollback
                  setEntries(prevEntries);
                  setFilteredEntries(prevFiltered);
                  setRefresh(r => !r);
                  Alert.alert('Error', 'ID data tidak valid');
                  return;
                }
                const numericId = Number(entryToDelete.id);
                if (isNaN(numericId) || numericId <= 0) {
                  // Rollback
                  setEntries(prevEntries);
                  setFilteredEntries(prevFiltered);
                  setRefresh(r => !r);
                  Alert.alert('Error', 'ID data tidak valid');
                  return;
                }
                switch(entryToDelete.type) {
                  case 'income':
                    response = await incomeAPI.deleteIncome(numericId);
                    break;
                  case 'expense':
                    response = await spendingAPI.deleteSpending(numericId);
                    break;
                  case 'asset':
                    response = await assetAPI.deleteAsset(numericId);
                    break;
                  case 'liability':
                    response = await liabilityAPI.deleteLiability(numericId);
                    break;
                  case 'equity':
                    response = await equityAPI.deleteEquity(numericId);
                    break;
                  default:
                    // Rollback
                    setEntries(prevEntries);
                    setFilteredEntries(prevFiltered);
                    setRefresh(r => !r);
                    Alert.alert('Error', 'Tipe data tidak valid');
                    return;
                }
                // Anggap sukses jika tidak throw error
                Alert.alert(getTranslation('successDelete'));
              } catch (error) {
                // Rollback
                setEntries(prevEntries);
                setFilteredEntries(prevFiltered);
                setRefresh(r => !r);
                Alert.alert(getTranslation('errorDelete'));
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  // Fungsi untuk mengedit entry (buka modal edit)
  const handleEdit = (indexToEdit: number) => {
    const entryToEdit = filteredEntries[indexToEdit];
    if (!entryToEdit) {
      Alert.alert('Error', getTranslation('notFound'));
      return;
    }
    setEditEntry(entryToEdit);
    setEditModalVisible(true);
  };

  // Handler simpan perubahan dari modal edit
  const handleSaveEdit = (updated: BookkeepingEntry) => {
    // Update di entries dan filteredEntries
    setEntries(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
    setFilteredEntries(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
    setRefresh(r => !r);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        <CustomText className="text-2xl font-bold text-center mb-4">{getTypeLabel(type)}</CustomText>
        {/* Modal Edit Entry */}
        <EditEntryModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          entry={editEntry}
          onSave={handleSaveEdit}
        />
        {renderDateFilter()}
        {renderLiabilityTermFilters()}
        {renderCategoryFilters()}
        {renderSearchBar()}
        {renderSummary()}
        <FlatList
          data={filteredEntries}
          keyExtractor={(item: BookkeepingEntry) => String(item.id)}
          ListEmptyComponent={<CustomText className="text-gray-400 text-center mt-4">{getTranslation('noData')}</CustomText>}
          renderItem={({ item, index }: { item: BookkeepingEntry; index: number }) => (
            <View className="flex-row items-center bg-white rounded-2xl border border-gray-200 mb-3 p-3 shadow-md">
              <View className="w-12 h-12 bg-gray-200 rounded-2xl mr-3 items-center justify-center flex">
                <Ionicons
                  name={
                    item.type === 'income' ? 'arrow-up' :
                    item.type === 'expense' ? 'arrow-down' :
                    item.type === 'asset' ? 'cube' :
                    item.type === 'liability' ? 'git-branch' :
                    'people'
                  }
                  size={24}
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
                {item.type === 'income' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {getCategoryLabel(item)}
                    </CustomText>
                    {/* Jumlah Income */}
                    {item.amount && (
                      <CustomText className="text-gray-700 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        Jumlah: {formatCurrency(Number(item.amount))} {item.currency || 'IDR'}
                      </CustomText>
                    )}
                    {/* Pajak Income */}
                    {item.incomeTax && typeof item.incomeTax === 'number' && !isNaN(item.incomeTax) && (
                      <CustomText className="text-gray-700 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        Pajak: {item.incomeTax}%
                      </CustomText>
                    )}
                    {/* Tanggal Income */}
                    {item.date && (() => { const d = new Date(item.date); return !isNaN(d.getTime()); })() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {getTranslation('date')} {(() => { const d = new Date(item.date); return d.toLocaleDateString('id-ID'); })()}
                      </CustomText>
                    )}
                    {/* Deskripsi Income */}
                    {item.description && !!item.description.trim() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={2} ellipsizeMode="tail">
                        {item.description}
                      </CustomText>
                    )}
                    {/* Amount di bawah */}
                    <CustomText className="font-bold text-green-600 mt-2" numberOfLines={1} ellipsizeMode="tail">
                      +{formatCurrency(Number(item.amount || item.mainIncome || item.sideIncome || 0))}
                    </CustomText>
                  </>
                ) : item.type === 'expense' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {getCategoryLabel(item)}
                    </CustomText>
                    {/* Tanggal Pengeluaran */}
                    {item.date && (() => { const d = new Date(item.date); return !isNaN(d.getTime()); })() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {getTranslation('date')}: {(() => { const d = new Date(item.date); return d.toLocaleDateString('id-ID'); })()}
                      </CustomText>
                    )}
                    {/* Deskripsi Pengeluaran */}
                    {item.description && !!item.description.trim() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={2} ellipsizeMode="tail">
                        {item.description}
                      </CustomText>
                    )}
                    {/* Amount di bawah */}
                    <CustomText className="font-bold text-red-600 mt-2" numberOfLines={1} ellipsizeMode="tail">
                      -{formatCurrency(Number(item.amount || 0))}
                    </CustomText>
                  </>
                ) : item.type === 'asset' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {item.assetName}
                    </CustomText>
                    {/* Tipe Aset */}
                    {item.assetType && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {getTranslation('assetType')}: {getTranslation(item.assetType)}
                      </CustomText>
                    )}
                    {/* Kategori Aset */}
                    {item.category && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {getTranslation('assetCategory')}: {getTranslation(item.category)}
                      </CustomText>
                    )}
                    {/* Tanggal Aset */}
                    {item.date && (() => { const d = new Date(item.date); return !isNaN(d.getTime()); })() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {getTranslation('date')} {(() => { const d = new Date(item.date); return d.toLocaleDateString('id-ID'); })()}
                      </CustomText>
                    )}
                    {/* Keterangan Aset */}
                    {item.description && !!item.description.trim() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={2} ellipsizeMode="tail">
                        {getTranslation('description')}: {item.description}
                      </CustomText>
                    )}
                    {/* Amount/value di bawah */}
                    {(() => {
                      const cat = (item.name || '').toLowerCase();
                      if (assetInCategories.includes(cat)) {
                        return (
                          <CustomText className="font-bold text-green-600 mt-2" numberOfLines={1} ellipsizeMode="tail">
                            {formatCurrency(Number(item.value || 0))}
                          </CustomText>
                        );
                      } else if (assetOutCategories.includes(cat)) {
                        return (
                          <CustomText className="font-bold text-red-600 mt-2" numberOfLines={1} ellipsizeMode="tail">
                            -{formatCurrency(Number(item.value || 0))}
                          </CustomText>
                        );
                      } else {
                        return (
                          <CustomText className="font-bold text-blue-600 mt-2" numberOfLines={1} ellipsizeMode="tail">
                            {formatCurrency(Number(item.value || 0))}
                          </CustomText>
                        );
                      }
                    })()}
                  </>
                ) : item.type === 'liability' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </CustomText>
                    {/* Tipe Liability */}
                    {item.liabilityType && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        Tipe: {item.liabilityType}
                      </CustomText>
                    )}
                    {/* Kategori */}
                    {item.category && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        Kategori: {item.category}
                      </CustomText>
                    )}
                    {/* Tanggal dibuat */}
                    {item.date && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        Dibuat: {new Date(item.date).toLocaleDateString('id-ID')}
                      </CustomText>
                    )}
                    {/* Jatuh Tempo */}
                    {item.dueDate && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        Jatuh Tempo: {new Date(item.dueDate).toLocaleDateString('id-ID')}
                      </CustomText>
                    )}
                    {/* Amount/value di bawah */}
                    {(() => {
                      const cat = (item.category || '').toLowerCase();
                      if (cat === 'bank_loan') {
                        return (
                          <CustomText className="font-bold text-green-600 mt-2" numberOfLines={1} ellipsizeMode="tail">
                            {formatCurrency(Number(item.value || 0))}
                          </CustomText>
                        );
                      } else {
                        return (
                          <CustomText className="font-bold text-red-600 mt-2" numberOfLines={1} ellipsizeMode="tail">
                            -{formatCurrency(Number(item.value || 0))}
                          </CustomText>
                        );
                      }
                    })()}
                  </>
                ) : item.type === 'equity' ? (
                  <>
                    <CustomText className="font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
                      {item.name || '-'}
                    </CustomText>
                    {/* Kategori Equity */}
                    {item.category && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {getTranslation('category')}: {getTranslation(item.category)}
                      </CustomText>
                    )}
                    {/* Tanggal Equity */}
                    {item.date && (() => { const d = new Date(item.date); return !isNaN(d.getTime()); })() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={1} ellipsizeMode="tail">
                        {getTranslation('date')}  {(() => { const d = new Date(item.date); return d.toLocaleDateString('id-ID'); })()}
                      </CustomText>
                    )}
                    {/* Deskripsi Equity */}
                    {item.description && !!item.description.trim() && (
                      <CustomText className="text-gray-500 text-sm mt-1" numberOfLines={2} ellipsizeMode="tail">
                        {item.description}
                      </CustomText>
                    )}
                    {/* Amount/value di bawah */}
                    <CustomText className={`font-bold mt-2 ${item.category === 'withdrawal' ? 'text-red-600' : 'text-purple-600'}`} numberOfLines={1} ellipsizeMode="tail">
                      {item.category === 'withdrawal' ? '-' : '+'}{formatCurrency(Number(item.value || 0))}
                    </CustomText>
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
                <TouchableOpacity onPress={() => handleEdit(index)} className="ml-2 bg-blue-100 rounded-full p-2 shadow-sm" activeOpacity={0.7}>
                  <Ionicons name="create-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(index)} className="ml-2 bg-red-100 rounded-full p-2 shadow-sm" activeOpacity={0.7}>
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          extraData={refresh}
        />
      </View>
    </SafeAreaView>
  );
} 
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { assetAPI, equityAPI, incomeAPI, liabilityAPI, spendingAPI } from '../../lib/utils/api';
import { logout } from '../../lib/utils/auth';
import { Language, useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';

export default function AddScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { getTranslation, language, setLanguage, currency, setCurrency, convertToIDR } = useLanguage();
  const { canAccessAsset, canAccessLiability, canAccessEquity, isUsahawan, userRole } = useRole();

  // Initialize tab based on user permissions
  const getInitialTab = () => {
    if (isUsahawan) {
      return 'income'; // Usahawan can only access income and expense
    }
    return 'income'; // Default for akuntan
  };

  const [tab, setTab] = useState(getInitialTab());

  // Update tab if user role changes and current tab is not allowed
  React.useEffect(() => {
    if (isUsahawan && (tab === 'asset' || tab === 'liability' || tab === 'equity')) {
      setTab('income');
    }
  }, [isUsahawan, tab]);

  // Semua array label yang butuh translate didefinisikan di dalam komponen
  const TABS = React.useMemo(() => {
    const baseTabs = [
      { label: getTranslation('income'), value: 'income', icon: 'arrow-up-outline', color: '#22c55e' },
      { label: getTranslation('expense'), value: 'expense', icon: 'arrow-down-outline', color: '#ef4444' },
    ];

    // Only add asset, liability, equity tabs if user has permission
    if (canAccessAsset) {
      baseTabs.push({ label: getTranslation('asset'), value: 'asset', icon: 'cube-outline', color: '#3b82f6' });
    }
    if (canAccessLiability) {
      baseTabs.push({ label: getTranslation('liability'), value: 'liability', icon: 'git-branch-outline', color: '#f59e42' });
    }
    if (canAccessEquity) {
      baseTabs.push({ label: getTranslation('equity'), value: 'equity', icon: 'people-outline', color: '#a855f7' });
    }

    return baseTabs;
  }, [getTranslation, language, canAccessAsset, canAccessLiability, canAccessEquity]);

  // Ensure current tab is valid for user permissions
  React.useEffect(() => {
    const availableTabValues = TABS.map(t => t.value);
    if (!availableTabValues.includes(tab)) {
      setTab(availableTabValues[0]);
    }
  }, [TABS, tab]);

  const PERIODS = React.useMemo(() => ([
    { label: getTranslation('daily'), value: 'daily' },
    { label: getTranslation('weekly'), value: 'weekly' },
    { label: getTranslation('monthly'), value: 'monthly' },
    { label: getTranslation('yearly'), value: 'yearly' },
  ]), [getTranslation, language]);

  const EXPENSE_CATEGORIES = React.useMemo(() => ([
    { label: getTranslation('salary'), value: 'salary' },
    { label: getTranslation('utilities'), value: 'utilities' },
    { label: getTranslation('transport'), value: 'transport' },
    { label: getTranslation('packaging'), value: 'packaging' },
    { label: getTranslation('advertising'), value: 'advertising' },
    { label: getTranslation('license'), value: 'license' },
    { label: getTranslation('rent'), value: 'rent' },
    { label: getTranslation('others'), value: 'others' },
  ]), [getTranslation, language]);

  const LIABILITY_STATUS = React.useMemo(() => ([
    { label: getTranslation('unpaid'), value: 'unpaid' },
    { label: getTranslation('partial'), value: 'partial' },
    { label: getTranslation('paid'), value: 'paid' },
  ]), [getTranslation, language]);

  const EQUITY_TYPES = React.useMemo(() => ([
    { label: getTranslation('initial'), value: 'initial' },
    { label: getTranslation('retained'), value: 'retained' },
    { label: getTranslation('withdrawal'), value: 'withdrawal' },
    { label: getTranslation('additional'), value: 'additional' },
  ]), [getTranslation, language]);

  const ASSET_TYPES = React.useMemo(() => ([
    { label: getTranslation('current'), value: 'current' },
    { label: getTranslation('fixed'), value: 'fixed' },
  ]), [getTranslation, language]);

  const SHORT_TERM_LIABILITY_CATEGORIES = React.useMemo(() => ([
    { label: getTranslation('selectCategory'), value: '' },
    { label: getTranslation('accountable'), value: 'accountable' },
    { label: getTranslation('monthly_loan'), value: 'monthly_loan' },
    { label: getTranslation('repayment'), value: 'repayment' },
    { label: getTranslation('others'), value: 'others' },
  ]), [getTranslation, language]);

  const LONG_TERM_LIABILITY_CATEGORIES = React.useMemo(() => ([
    { label: getTranslation('selectCategory'), value: '' },
    { label: getTranslation('bank_loan'), value: 'bank_loan' },
    { label: getTranslation('others'), value: 'others' },
  ]), [getTranslation, language]);

  const FIXED_ASSET_CATEGORIES = React.useMemo(() => ([
    { label: getTranslation('building'), value: 'bangunan' },
    { label: getTranslation('vehicle'), value: 'kendaraan' },
    { label: getTranslation('equipment'), value: 'peralatan' },
    { label: getTranslation('machine'), value: 'mesin' },
    { label: getTranslation('fixed_investment'), value: 'investasi_tetap' },
  ]), [getTranslation, language]);

  const CURRENT_ASSET_CATEGORIES = React.useMemo(() => ([
    { label: getTranslation('cash_in_hand'), value: 'cash_in_hand' },
    { label: getTranslation('cash_in_bank'), value: 'cash_in_bank' },
    { label: getTranslation('receivable'), value: 'penghutang' },
    { label: getTranslation('deposit'), value: 'deposit' },
    { label: getTranslation('inventory'), value: 'inventory' },
    { label: getTranslation('current_investment'), value: 'investasi_lancar' },
  ]), [getTranslation, language]);

  // Set header style
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

  // Income
  const [incomeDate, setIncomeDate] = useState(new Date());
  const [showIncomeDate, setShowIncomeDate] = useState(false);
  const [incomeCategory, setIncomeCategory] = useState('main');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeTax, setIncomeTax] = useState('');

  // Expense
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showExpenseDate, setShowExpenseDate] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [expensePeriod, setExpensePeriod] = useState('monthly');

  // Asset
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetType, setAssetType] = useState('current');
  const [assetCategory, setAssetCategory] = useState('');
  const [assetDate, setAssetDate] = useState(new Date());
  const [showAssetDate, setShowAssetDate] = useState(false);
  const [assetDescription, setAssetDescription] = useState('');

  // Liability
  const [liabilityName, setLiabilityName] = useState('');
  const [liabilityValue, setLiabilityValue] = useState('');
  const [liabilityDate, setLiabilityDate] = useState(new Date());
  const [liabilityDueDate, setLiabilityDueDate] = useState(new Date());
  const [showLiabilityDate, setShowLiabilityDate] = useState(false);
  const [showLiabilityDueDate, setShowLiabilityDueDate] = useState(false);
  const [liabilityCategory, setLiabilityCategory] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');

  // Equity
  const [equityName, setEquityName] = useState('');
  const [equityValue, setEquityValue] = useState('');
  const [equityType, setEquityType] = useState('initial');
  const [equityDate, setEquityDate] = useState(new Date());
  const [showEquityDate, setShowEquityDate] = useState(false);
  const [equityDescription, setEquityDescription] = useState('');

  // Tambahkan state untuk input aktif
  const [activeInput, setActiveInput] = useState<string | null>(null);

  const liabilityTerm = React.useMemo(() => {
    const diffTime = liabilityDueDate.getTime() - liabilityDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 365 ? 'long-term' : 'short-term';
  }, [liabilityDate, liabilityDueDate]);

  const handleSave = async () => {
    try {
      // Check if usahawan is trying to access restricted tabs
      if (isUsahawan && (tab === 'asset' || tab === 'liability' || tab === 'equity')) {
        Alert.alert(
          getTranslation('accessDenied'),
          getTranslation('accessDeniedMessage'),
          [{ text: 'OK' }]
        );
        return;
      }

      if (tab === 'income') {
        if (!incomeAmount || !incomeCategory) {
          Alert.alert('Error', getTranslation('errorEmptyFields'));
          return;
        }
        const amount = Number(incomeAmount);
        if (isNaN(amount) || amount <= 0) {
          Alert.alert('Error', getTranslation('errorSave'));
          return;
        }
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(amount);
        console.log('Tanggal yang dikirim:', incomeDate);
        const response = await incomeAPI.createIncome({
          type: incomeCategory,
          amount: amountInIDR,
          description: incomeDesc,
          incomeTax: Number(incomeTax) || 0,
          incomeDate: incomeDate.toISOString()
        });
        console.log('Income API response:', response);
        
        // Check if the response indicates success
        if (response && (response.status === true || response.status === 'success' || response.message === 'Data Created')) {
          const data = response.data || response;
          setIncomeDate(incomeDate);
          setIncomeCategory('main');
          setIncomeAmount('');
          setIncomeTax('');
          setIncomeDesc('');
          Alert.alert(getTranslation('successTitle'), getTranslation('successSave'));
        } else {
          throw new Error('Failed to save income');
        }
      } else if (tab === 'expense') {
        if (!amount || !category || category === '') {
          Alert.alert('Error', getTranslation('errorEmptyFields'));
          return;
        }
        const expenseAmount = Number(amount);
        if (isNaN(expenseAmount) || expenseAmount <= 0) {
          Alert.alert('Error', getTranslation('errorSave'));
          return;
        }
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(expenseAmount);
        console.log('Tanggal yang dikirim:', expenseDate);
        const response = await spendingAPI.createSpending({
          spendingType: category,
          amount: amountInIDR,
          description: description,
          spendDate: expenseDate.toISOString()
        });
        console.log('Expense API response:', response);
        
        // Check if the response indicates success
        if (response && (response.status === true || response.status === 'success' || response.message === 'Data Created')) {
          const data = response.data || response;
          setExpenseDate(expenseDate);
          setCategory('');
          setAmount('');
          setDescription('');
          Alert.alert(getTranslation('successTitle'), getTranslation('successSave'));
        } else {
          throw new Error('Failed to save expense');
        }
      } else if (tab === 'asset') {
        if (!assetName || !assetValue || !assetType || !assetCategory || assetCategory === '') {
          Alert.alert('Error', getTranslation('errorEmptyFields'));
          return;
        }
        const amount = Number(assetValue);
        if (isNaN(amount) || amount <= 0) {
          Alert.alert('Error', getTranslation('errorSave'));
          return;
        }
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(amount);
        const response = await assetAPI.createAsset({
          assetName: assetName,
          assetValue: amountInIDR,
          assetType: assetType,
          assetCategory: assetCategory,
          assetDate: assetDate.toISOString(),
          assetDescription: assetDescription,
          createdAt: assetDate.toISOString()
        });
        
        console.log('Asset API response:', response);
        
        // Check if the response indicates success
        if (response && (response.status === true || response.status === 'success' || response.message === 'Data Created')) {
          setAssetName('');
          setAssetValue('');
          setAssetType('current');
          setAssetCategory('');
          setAssetDate(new Date());
          setAssetDescription('');
          Alert.alert('Berhasil', 'Data berhasil disimpan!');
        } else {
          throw new Error('Failed to save asset');
        }
      } else if (tab === 'liability') {
        if (!liabilityName || !liabilityValue || !liabilityCategory || liabilityCategory === '') {
          Alert.alert('Error', getTranslation('errorEmptyFields'));
          return;
        }
        const liabilityAmount = Number(liabilityValue);
        if (isNaN(liabilityAmount) || liabilityAmount <= 0) {
          Alert.alert('Error', getTranslation('errorSave'));
          return;
        }
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(liabilityAmount);
        const response = await liabilityAPI.createLiability({
          liabilityType: liabilityTerm,
          liabilityCategory: liabilityCategory,
          amount: amountInIDR,
          createdAt: liabilityDate.toISOString(),
          dueDate: liabilityDueDate.toISOString(),
          description: liabilityName,
        });
        if (response && (response.status === true || response.status === 'success' || response.message === 'Data Created')) {
          setLiabilityName('');
          setLiabilityValue('');
          setLiabilityDate(new Date());
          setLiabilityDueDate(new Date());
          setLiabilityCategory('');
          setPaymentStatus('unpaid');
          Alert.alert(getTranslation('successTitle'), getTranslation('successSave'));
        } else {
          throw new Error('Failed to save liability');
        }
      } else if (tab === 'equity') {
        if (!equityName || !equityValue || !equityType) {
          Alert.alert('Error', getTranslation('errorEmptyFields'));
          return;
        }
        const amount = Number(equityValue);
        if (isNaN(amount) || amount <= 0) {
          Alert.alert('Error', getTranslation('errorSave'));
          return;
        }
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(amount);
        const response = await equityAPI.createEquity({
          equityName: equityName,
          equityType: equityType,
          amount: amountInIDR,
          description: equityDescription,
          equityDate: equityDate.toISOString().split('T')[0],
        });
        
        console.log('Equity API response:', response);
        
        // Check if the response indicates success
        if (response && (response.status === true || response.status === 'success' || response.message === 'Data Created')) {
          setEquityName('');
          setEquityValue('');
          setEquityType('initial');
          setEquityDate(new Date());
          setEquityDescription('');
          Alert.alert('Berhasil', 'Data berhasil disimpan!');
        } else {
          throw new Error('Failed to save equity');
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', getTranslation('errorSave'));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      alert(getTranslation('errorLoginFailed'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 -mt-[25px] mb-[50px]" contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
        <View
          className="p-4"
          style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
        >
          {/* Header */}
          <CustomText className="text-3xl font-extrabold text-center text-gray-800 mb-6">
            {getTranslation('formTitle')}
          </CustomText>

          {/* Segmented Control */}
          <View className="flex-row justify-center mb-6 flex-wrap gap-3 px-2">
            {TABS.map((t) => {
              const isActive = tab === t.value;
              
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setTab(t.value)}
                  activeOpacity={0.8}
                  className={`flex-row items-center px-5 py-2.5 rounded-full shadow-sm transition-all`}
                  style={{
                    backgroundColor: isActive ? t.color + '22' : '#ffffff',
                    borderColor: isActive ? t.color : '#e5e7eb',
                    borderWidth: 1,
                  }}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={18}
                    color={isActive ? t.color : '#9ca3af'}
                    style={{ marginRight: 6 }}
                  />
                  <CustomText
                    className="text-sm font-semibold"
                    style={{
                      color: isActive ? t.color : '#6b7280',
                    }}
                  >
                    {t.label}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>


          {/* Dynamic Form */}
          {tab === 'income' && (
            <View
              className="bg-[#f0fdf4] rounded-2xl shadow-lg p-5 mb-6 border border-green-100"
              style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="arrow-up-outline" size={22} color="#16a34a" style={{ marginRight: 8 }} />
                <CustomText className="text-xl font-bold text-[#16a34a]">Pendapatan</CustomText>
              </View>

              <View style={{ height: 1, backgroundColor: '#d1fae5', marginBottom: 20 }} />

              {/* Input Tanggal */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('date')}</CustomText>
              <TouchableOpacity
                className="flex-row items-center bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'incomeDate' ? '#16a34a' : '#d1d5db',
                  borderWidth: 1,
                }}
                onPress={() => {
                  setShowIncomeDate(true);
                  setActiveInput('incomeDate');
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <CustomText className="ml-3 text-gray-800">
                  {incomeDate ? incomeDate.toLocaleDateString('id-ID') : 'Pilih tanggal'}
                </CustomText>
              </TouchableOpacity>
              {showIncomeDate && (
                <DateTimePicker
                  value={incomeDate}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate?: Date) => {
                    setShowIncomeDate(false);
                    if (selectedDate) setIncomeDate(selectedDate);
                  }}
                />
              )}

              {/* Input Kategori */}
              <CustomText className="text-gray-700 mb-2 font-semibold">{getTranslation('category')}</CustomText>
              <View className="flex-row space-x-3 mb-5">
                {['main', 'side'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setIncomeCategory(val)}
                    className={`flex-1 rounded-xl px-4 py-3 border text-center ${
                      incomeCategory === val
                        ? 'border-[#16a34a] bg-[#ecfdf5]'
                        : 'border-gray-300 bg-white'
                    }`}
                    activeOpacity={0.85}
                  >
                    <CustomText
                      className={`text-base font-medium ${
                        incomeCategory === val ? 'text-[#16a34a]' : 'text-gray-700'
                      }`}
                    >
                      {val === 'main' ? 'Utama' : 'Tambahan'}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input Jumlah Uang */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('amount')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'incomeAmount' ? '#16a34a' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={`${getTranslation('enterAmount')} (${currency})`}
                keyboardType="numeric"
                value={incomeAmount}
                onChangeText={setIncomeAmount}
                onFocus={() => setActiveInput('incomeAmount')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Input Pajak */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('tax')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'incomeTax' ? '#16a34a' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={getTranslation('enterTax')}
                keyboardType="numeric"
                value={incomeTax}
                onChangeText={setIncomeTax}
                onFocus={() => setActiveInput('incomeTax')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Input Keterangan */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('description')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3"
                style={{
                  borderColor: activeInput === 'incomeDesc' ? '#16a34a' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={getTranslation('enterDescription')}
                value={incomeDesc}
                onChangeText={setIncomeDesc}
                onFocus={() => setActiveInput('incomeDesc')}
                onBlur={() => setActiveInput(null)}
              />
            </View>


          )}

          {tab === 'expense' && (
            <View
              className="bg-[#fef2f2] rounded-2xl shadow-lg p-5 mb-6 border border-red-100"
              style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
            >
              {/* Header */}
              <View className="flex-row items-center mb-4">
                <Ionicons name="arrow-down-outline" size={22} color="#ef4444" style={{ marginRight: 8 }} />
                <CustomText className="text-xl font-bold text-[#ef4444]">Pengeluaran</CustomText>
              </View>

              <View style={{ height: 1, backgroundColor: '#fecaca', marginBottom: 20 }} />

              {/* Input Tanggal */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('date')}</CustomText>
              <TouchableOpacity
                className="flex-row items-center bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'expenseDate' ? '#ef4444' : '#d1d5db',
                  borderWidth: 1,
                }}
                onPress={() => {
                  setShowExpenseDate(true);
                  setActiveInput('expenseDate');
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <CustomText className="ml-3 text-gray-800">
                  {expenseDate ? expenseDate.toLocaleDateString('id-ID') : 'Pilih tanggal'}
                </CustomText>
              </TouchableOpacity>
              {showExpenseDate && (
                <DateTimePicker
                  value={expenseDate}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate?: Date) => {
                    setShowExpenseDate(false);
                    if (selectedDate) setExpenseDate(selectedDate);
                  }}
                />
              )}

              {/* Input Kategori */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('category')}</CustomText>
              <View
                className="rounded-xl overflow-hidden mb-5"
                style={{
                  borderColor: activeInput === 'category' ? '#ef4444' : '#d1d5db',
                  borderWidth: 1,
                  backgroundColor: '#fff',
                }}
              >
                <Picker
                  selectedValue={category}
                  onValueChange={(value) => setCategory(value)}
                  style={{
                    height: 50,
                    color: category ? '#111827' : '#9ca3af', // hitam kalau dipilih, abu kalau belum
                  }}
                  onFocus={() => setActiveInput('category')}
                  onBlur={() => setActiveInput(null)}
                >
                  <Picker.Item label={getTranslation('selectCategory')} value="" />
                  {EXPENSE_CATEGORIES.map((c) => (
                    <Picker.Item key={c.value} label={c.label} value={c.value} />
                  ))}
                </Picker>
              </View>

              {/* Input Jumlah Uang */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('amount')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'amount' ? '#ef4444' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={`${getTranslation('enterAmount')} (${currency})`}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                onFocus={() => setActiveInput('amount')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Input Keterangan */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('description')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3"
                style={{
                  borderColor: activeInput === 'description' ? '#ef4444' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={getTranslation('enterDescription')}
                value={description}
                onChangeText={setDescription}
                onFocus={() => setActiveInput('description')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          )}


          {tab === 'asset' && !isUsahawan && (
            <View
              className="bg-[#eff6ff] rounded-2xl shadow-lg p-5 mb-6 border border-blue-100"
              style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
            >
              {/* Header */}
              <View className="flex-row items-center mb-4">
                <Ionicons name="cube-outline" size={22} color="#3b82f6" style={{ marginRight: 8 }} />
                <CustomText className="text-xl font-bold text-[#3b82f6]">Aset</CustomText>
              </View>

              <View style={{ height: 1, backgroundColor: '#bfdbfe', marginBottom: 20 }} />

              {/* Nama Aset */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetName')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'assetName' ? '#3b82f6' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={getTranslation('enterAssetName')}
                value={assetName}
                onChangeText={setAssetName}
                onFocus={() => setActiveInput('assetName')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Nilai Aset */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetValue')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'assetValue' ? '#3b82f6' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={`${getTranslation('enterAssetValue')} (${currency})`}
                keyboardType="numeric"
                value={assetValue}
                onChangeText={setAssetValue}
                onFocus={() => setActiveInput('assetValue')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Jenis Aset */}
              <CustomText className="text-gray-700 mb-2 font-semibold">{getTranslation('assetType')}</CustomText>
              <View className="flex-row space-x-3 mb-5">
                <TouchableOpacity
                  onPress={() => {
                    setAssetType('fixed');
                    setAssetCategory('');
                  }}
                  className={`flex-1 rounded-xl px-4 py-3 border text-center ${
                    assetType === 'fixed' ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-gray-300 bg-white'
                  }`}
                  activeOpacity={0.8}
                >
                  <CustomText className={`text-base font-medium ${assetType === 'fixed' ? 'text-[#3b82f6]' : 'text-gray-700'}`}>
                    {getTranslation('fixed')}
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setAssetType('current');
                    setAssetCategory('');
                  }}
                  className={`flex-1 rounded-xl px-4 py-3 border text-center ${
                    assetType === 'current' ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-gray-300 bg-white'
                  }`}
                  activeOpacity={0.8}
                >
                  <CustomText className={`text-base font-medium ${assetType === 'current' ? 'text-[#3b82f6]' : 'text-gray-700'}`}>
                    {getTranslation('current')}
                  </CustomText>
                </TouchableOpacity>
              </View>

              {/* Kategori Aset */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetCategory')}</CustomText>
              <View
                className="rounded-xl overflow-hidden mb-5"
                style={{
                  borderColor: activeInput === 'assetCategory' ? '#3b82f6' : '#d1d5db',
                  borderWidth: 1,
                  backgroundColor: '#fff',
                }}
              >
                <Picker
                  selectedValue={assetCategory}
                  onValueChange={setAssetCategory}
                  style={{
                    height: 50,
                    color: assetCategory ? '#111827' : '#9ca3af',
                  }}
                  onFocus={() => setActiveInput('assetCategory')}
                  onBlur={() => setActiveInput(null)}
                >
                  <Picker.Item label={getTranslation('selectCategory')} value="" />
                  {(assetType === 'fixed' ? FIXED_ASSET_CATEGORIES : CURRENT_ASSET_CATEGORIES).map((cat) => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                  ))}
                </Picker>
              </View>

              {/* Tanggal Perolehan */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetDate')}</CustomText>
              <TouchableOpacity
                className="flex-row items-center bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'assetDate' ? '#3b82f6' : '#d1d5db',
                  borderWidth: 1,
                }}
                onPress={() => {
                  setShowAssetDate(true);
                  setActiveInput('assetDate');
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <CustomText className="ml-3 text-gray-800">{assetDate.toLocaleDateString('id-ID')}</CustomText>
              </TouchableOpacity>
              {showAssetDate && (
                <DateTimePicker
                  value={assetDate}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowAssetDate(false);
                    if (selectedDate) setAssetDate(selectedDate);
                  }}
                />
              )}

              {/* Keterangan */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetDescription')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3"
                style={{
                  borderColor: activeInput === 'assetDescription' ? '#3b82f6' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={getTranslation('enterAssetDescription')}
                value={assetDescription}
                onChangeText={setAssetDescription}
                multiline
                numberOfLines={3}
                onFocus={() => setActiveInput('assetDescription')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          )}


          {tab === 'liability' && !isUsahawan && (
            <View
              className="bg-[#fff7ed] rounded-2xl shadow-lg p-5 mb-6 border border-orange-100"
              style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
            >
              {/* Header */}
              <View className="flex-row items-center mb-4">
                <Ionicons name="git-branch-outline" size={22} color="#f59e0b" style={{ marginRight: 8 }} />
                <CustomText className="text-xl font-bold text-[#f59e0b]">Liabilitas</CustomText>
              </View>

              <View style={{ height: 1, backgroundColor: '#fde68a', marginBottom: 20 }} />

              {/* Nama Liabilitas */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityName')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'liabilityName' ? '#f59e0b' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={getTranslation('enterLiabilityName')}
                value={liabilityName}
                onChangeText={setLiabilityName}
                onFocus={() => setActiveInput('liabilityName')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Jumlah Utang */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityValue')}</CustomText>
              <TextInput
                className="bg-white border rounded-xl px-4 py-3 mb-5"
                style={{
                  borderColor: activeInput === 'liabilityValue' ? '#f59e0b' : '#d1d5db',
                  borderWidth: 1,
                }}
                placeholder={`${getTranslation('enterLiabilityValue')} (${currency})`}
                keyboardType="numeric"
                value={liabilityValue}
                onChangeText={setLiabilityValue}
                onFocus={() => setActiveInput('liabilityValue')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Tanggal Pencatatan & Jatuh Tempo */}
              <View className="flex-row justify-between mb-5 space-x-3">
                {/* Tanggal Pencatatan */}
                <View className="flex-1">
                  <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityDate')}</CustomText>
                  <TouchableOpacity
                    className="flex-row items-center bg-white border rounded-xl px-4 py-3"
                    style={{
                      borderColor: activeInput === 'liabilityDate' ? '#f59e0b' : '#d1d5db',
                      borderWidth: 1,
                    }}
                    onPress={() => {
                      setShowLiabilityDate(true);
                      setActiveInput('liabilityDate');
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <CustomText className="ml-3 text-gray-800">
                      {liabilityDate.toLocaleDateString('id-ID')}
                    </CustomText>
                  </TouchableOpacity>
                  {showLiabilityDate && (
                    <DateTimePicker
                      value={liabilityDate}
                      mode="date"
                      display="default"
                      onChange={(_, selectedDate) => {
                        setShowLiabilityDate(false);
                        if (selectedDate) setLiabilityDate(selectedDate);
                      }}
                    />
                  )}
                </View>

                {/* Jatuh Tempo */}
                <View className="flex-1">
                  <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityDueDate')}</CustomText>
                  <TouchableOpacity
                    className="flex-row items-center bg-white border rounded-xl px-4 py-3"
                    style={{
                      borderColor: activeInput === 'liabilityDueDate' ? '#f59e0b' : '#d1d5db',
                      borderWidth: 1,
                    }}
                    onPress={() => {
                      setShowLiabilityDueDate(true);
                      setActiveInput('liabilityDueDate');
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <CustomText className="ml-3 text-gray-800">
                      {liabilityDueDate.toLocaleDateString('id-ID')}
                    </CustomText>
                  </TouchableOpacity>
                  {showLiabilityDueDate && (
                    <DateTimePicker
                      value={liabilityDueDate}
                      mode="date"
                      display="default"
                      onChange={(_, selectedDate) => {
                        setShowLiabilityDueDate(false);
                        if (selectedDate) setLiabilityDueDate(selectedDate);
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Kategori */}
              <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityCategory')}</CustomText>
              <View
                className="rounded-xl overflow-hidden mb-2"
                style={{
                  borderColor: activeInput === 'liabilityCategory' ? '#f59e0b' : '#d1d5db',
                  borderWidth: 1,
                  backgroundColor: '#fff',
                }}
              >
                <Picker
                  selectedValue={liabilityCategory}
                  onValueChange={(value) => setLiabilityCategory(value)}
                  style={{
                    height: 50,
                    color: liabilityCategory ? '#111827' : '#9ca3af',
                  }}
                  onFocus={() => setActiveInput('liabilityCategory')}
                  onBlur={() => setActiveInput(null)}
                >
                  {(liabilityTerm === 'short-term'
                    ? SHORT_TERM_LIABILITY_CATEGORIES
                    : LONG_TERM_LIABILITY_CATEGORIES
                  ).map((cat) => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                  ))}
                </Picker>
              </View>

              
            </View>
          )}


{tab === 'equity' && !isUsahawan && (
  <View
    className="bg-[#faf5ff] rounded-2xl shadow-lg p-5 mb-6 border border-purple-100"
    style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
  >
    {/* Header */}
    <View className="flex-row items-center mb-4">
      <Ionicons name="people-outline" size={22} color="#a855f7" style={{ marginRight: 8 }} />
      <CustomText className="text-xl font-bold text-[#a855f7]">Ekuiti</CustomText>
    </View>

    <View style={{ height: 1, backgroundColor: '#e9d5ff', marginBottom: 20 }} />

    {/* Nama Ekuiti */}
    <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('equityName')}</CustomText>
    <TextInput
      className="bg-white border rounded-xl px-4 py-3 mb-5"
      style={{
        borderColor: activeInput === 'equityName' ? '#a855f7' : '#d1d5db',
        borderWidth: 1,
      }}
      placeholder={getTranslation('enterEquityName')}
      value={equityName}
      onChangeText={setEquityName}
      onFocus={() => setActiveInput('equityName')}
      onBlur={() => setActiveInput(null)}
    />

    {/* Nilai Ekuiti */}
    <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('equityValue')}</CustomText>
    <TextInput
      className="bg-white border rounded-xl px-4 py-3 mb-5"
      style={{
        borderColor: activeInput === 'equityValue' ? '#a855f7' : '#d1d5db',
        borderWidth: 1,
      }}
      placeholder={`${getTranslation('enterEquityValue')} (${currency})`}
      keyboardType="numeric"
      value={equityValue}
      onChangeText={setEquityValue}
      onFocus={() => setActiveInput('equityValue')}
      onBlur={() => setActiveInput(null)}
    />

    {/* Jenis Ekuiti */}
    <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('equityType')}</CustomText>
    <View
      className="rounded-xl overflow-hidden mb-5"
      style={{
        borderColor: activeInput === 'equityType' ? '#a855f7' : '#d1d5db',
        borderWidth: 1,
        backgroundColor: '#fff',
      }}
    >
      <Picker
        selectedValue={equityType}
        onValueChange={(value) => setEquityType(value)}
        style={{
          height: 50,
          color: equityType ? '#111827' : '#9ca3af',
        }}
        onFocus={() => setActiveInput('equityType')}
        onBlur={() => setActiveInput(null)}
      >
        {EQUITY_TYPES.map((type) => (
          <Picker.Item key={type.value} label={type.label} value={type.value} />
        ))}
      </Picker>
    </View>

    {/* Tanggal Transaksi */}
    <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('equityDate')}</CustomText>
    <TouchableOpacity
      className="flex-row items-center bg-white border rounded-xl px-4 py-3 mb-5"
      style={{
        borderColor: activeInput === 'equityDate' ? '#a855f7' : '#d1d5db',
        borderWidth: 1,
      }}
      onPress={() => {
        setShowEquityDate(true);
        setActiveInput('equityDate');
      }}
    >
      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
      <CustomText className="ml-3 text-gray-800">
        {equityDate.toLocaleDateString('id-ID')}
      </CustomText>
    </TouchableOpacity>
    {showEquityDate && (
      <DateTimePicker
        value={equityDate}
        mode="date"
        display="default"
        onChange={(_, selectedDate) => {
          setShowEquityDate(false);
          if (selectedDate) setEquityDate(selectedDate);
        }}
      />
    )}

    {/* Keterangan */}
    <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('equityDescription')}</CustomText>
    <TextInput
      className="bg-white border rounded-xl px-4 py-3"
      style={{
        borderColor: activeInput === 'equityDescription' ? '#a855f7' : '#d1d5db',
        borderWidth: 1,
      }}
      placeholder={getTranslation('enterEquityDescription')}
      value={equityDescription}
      onChangeText={setEquityDescription}
      multiline
      numberOfLines={3}
      onFocus={() => setActiveInput('equityDescription')}
      onBlur={() => setActiveInput(null)}
    />
  </View>
)}

          {/* Access Denied Message for Usahawan */}
          {isUsahawan && (tab === 'asset' || tab === 'liability' || tab === 'equity') && (
            <View className="bg-red-50 rounded-2xl p-6 mb-6 border border-red-200" style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
              <View className="flex-row items-center mb-3">
                <Ionicons name="lock-closed" size={24} color="#ef4444" style={{ marginRight: 8 }} />
                <CustomText className="text-lg font-bold text-red-600">Access Restricted</CustomText>
              </View>
              <CustomText className="text-red-700">
                You do not have permission to access this feature. Only accountants can manage assets, liabilities, and equity records.
              </CustomText>
            </View>
          )}

          <TouchableOpacity 
            className={`p-4 rounded-full mt-4 ${isUsahawan && (tab === 'asset' || tab === 'liability' || tab === 'equity') ? 'bg-gray-400' : 'bg-black'}`} 
            style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }} 
            onPress={handleSave}
            disabled={isUsahawan && (tab === 'asset' || tab === 'liability' || tab === 'equity')}
          >
            <CustomText className="text-white text-center font-semibold text-base">{getTranslation('save')}</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 
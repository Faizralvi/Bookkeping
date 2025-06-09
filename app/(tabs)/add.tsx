import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { saveEntries } from '../../lib/utils/storage';

const TABS = [
  { label: 'Pendapatan', value: 'income', icon: 'arrow-up-outline', color: '#22c55e' },
  { label: 'Pengeluaran', value: 'expense', icon: 'arrow-down-outline', color: '#ef4444' },
  { label: 'Aset', value: 'asset', icon: 'cube-outline', color: '#3b82f6' },
  { label: 'Liabiliti', value: 'liability', icon: 'git-branch-outline', color: '#f59e42' },
  { label: 'Ekuiti', value: 'equity', icon: 'people-outline', color: '#a855f7' },
];

const PERIODS = [
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Tahunan', value: 'yearly' },
];

const EXPENSE_CATEGORIES = [
  { label: 'Gaji', value: 'salary' },
  { label: 'Bil Utiliti', value: 'utilities' },
  { label: 'Minyak/Pengangkutan', value: 'transport' },
  { label: 'Kos Pembungkusan', value: 'packaging' },
  { label: 'Iklan', value: 'advertising' },
  { label: 'Yuran Lesen', value: 'license' },
  { label: 'Sewa', value: 'rent' },
  { label: 'Lain-lain', value: 'others' },
];

const LIABILITY_STATUS = [
  { label: 'Belum Dibayar', value: 'unpaid' },
  { label: 'Sebagian', value: 'partial' },
  { label: 'Lunas', value: 'paid' },
];

const EQUITY_TYPES = [
  { label: 'Modal Awal / Modal Disetor', value: 'initial' },
  { label: 'Laba Ditahan', value: 'retained' },
  { label: 'Prive', value: 'withdrawal' },
  { label: 'Tambahan Modal Disetor', value: 'additional' },
];

const ASSET_TYPES = [
  { label: 'Aset Lancar', value: 'current' },
  { label: 'Aset Tetap', value: 'fixed' },
];

const ASSET_STATUS = [
  { label: 'Masih Digunakan', value: 'in_use' },
  { label: 'Rusak', value: 'damaged' },
  { label: 'Dijual', value: 'sold' },
  { label: 'Disusutkan', value: 'depreciated' },
];

type DocumentResult = {
  name: string;
  type: string;
  size: number;
  uri: string;
} | null;

export default function AddScreen() {
  const [tab, setTab] = useState('income');
  const navigation = useNavigation();

  // Set header style
  React.useEffect(() => {
    navigation.setOptions({
      title: 'Tambah Data',
      headerStyle: { backgroundColor: '#232323' },
      headerTitleStyle: { color: 'white', fontWeight: 'bold' },
      headerTitleAlign: 'center',
      headerTintColor: 'white',
    });
  }, [navigation]);

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
  const [receipt, setReceipt] = useState<DocumentResult>(null);
  const [expensePeriod, setExpensePeriod] = useState('monthly');

  // Asset
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetType, setAssetType] = useState('current');
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
  const [lender, setLender] = useState('');
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.assets && result.assets[0]) {
        setReceipt({
          name: result.assets[0].name,
          type: result.assets[0].mimeType || '',
          size: result.assets[0].size || 0,
          uri: result.assets[0].uri,
        });
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleSave = async () => {
    if (tab === 'income') {
      await saveEntries([
        {
          type: 'income',
          date: incomeDate.toISOString(),
          category: incomeCategory,
          amount: incomeAmount,
          tax: incomeTax,
          description: incomeDesc,
        },
      ]);
      setIncomeDate(new Date());
      setIncomeCategory('main');
      setIncomeAmount('');
      setIncomeTax('');
      setIncomeDesc('');
      Alert.alert('Berhasil', 'Data berhasil disimpan!');
    } else if (tab === 'expense') {
      await saveEntries([
        {
          type: 'expense',
          date: expenseDate.toISOString(),
          category,
          amount,
          description,
        },
      ]);
      setExpenseDate(new Date());
      setCategory('');
      setAmount('');
      setDescription('');
      Alert.alert('Berhasil', 'Data berhasil disimpan!');
    } else if (tab === 'asset') {
      await saveEntries([
        {
          type: 'asset',
          name: assetName,
          value: assetValue,
          category: assetType,
          date: assetDate.toISOString(),
          description: assetDescription || undefined,
        },
      ]);
      setAssetName('');
      setAssetValue('');
      setAssetType('current');
      setAssetDate(new Date());
      setAssetDescription('');
      Alert.alert('Berhasil', 'Data berhasil disimpan!');
    } else if (tab === 'liability') {
      await saveEntries([
        {
          type: 'liability',
          name: liabilityName,
          value: liabilityValue,
          date: liabilityDate.toISOString(),
          dueDate: liabilityDueDate.toISOString(),
          lender: lender || undefined,
          paymentStatus: paymentStatus,
        },
      ]);
      setLiabilityName('');
      setLiabilityValue('');
      setLiabilityDate(new Date());
      setLiabilityDueDate(new Date());
      setLender('');
      setPaymentStatus('unpaid');
      Alert.alert('Berhasil', 'Data berhasil disimpan!');
    } else if (tab === 'equity') {
      await saveEntries([
        {
          type: 'equity',
          name: equityName,
          value: equityValue,
          category: equityType,
          date: equityDate.toISOString(),
          description: equityDescription || undefined,
        },
      ]);
      setEquityName('');
      setEquityValue('');
      setEquityType('initial');
      setEquityDate(new Date());
      setEquityDescription('');
      Alert.alert('Berhasil', 'Data berhasil disimpan!');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <CustomText className="text-2xl font-bold text-center mb-4">Tambah Data</CustomText>
          {/* Segmented Control */}
          <View className="flex-row justify-center mb-6 flex-wrap">
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.value}
                className={`flex-row items-center px-4 py-2 mr-2 mb-2 rounded-full border ${tab === t.value ? '' : 'bg-white'} ${tab === t.value ? '' : 'border-gray-300'}`}
                style={{
                  backgroundColor: tab === t.value ? t.color + '22' : 'white',
                  borderColor: tab === t.value ? t.color : '#d1d5db',
                  borderWidth: 1,
                }}
                onPress={() => setTab(t.value)}
              >
                <Ionicons
                  name={t.icon as any}
                  size={20}
                  color={tab === t.value ? t.color : '#232323'}
                  style={{ marginRight: 8 }}
                />
                <CustomText className={`font-medium ${tab === t.value ? '' : 'text-black'}`}
                  style={{ color: tab === t.value ? t.color : '#232323' }}
                >{t.label}</CustomText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Form */}
          {tab === 'income' && (
            <View className="bg-[#f6f6f7] rounded-2xl shadow p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="arrow-up-outline" size={22} color="#22c55e" style={{ marginRight: 8 }} />
                <CustomText className="text-lg font-bold" style={{ color: '#22c55e' }}>Pendapatan</CustomText>
              </View>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 }} />
              {/* Input Tanggal */}
              <CustomText className="text-gray-600 mb-1">Tanggal</CustomText>
              <TouchableOpacity
                className="border rounded-lg p-3 mb-2 flex-row items-center"
                style={{ borderColor: activeInput === 'incomeDate' ? '#22c55e' : '#d1d5db', borderWidth: 1 }}
                onPress={() => { setShowIncomeDate(true); setActiveInput('incomeDate'); }}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <CustomText className="ml-2">{incomeDate ? incomeDate.toLocaleDateString('id-ID') : 'Pilih tanggal'}</CustomText>
              </TouchableOpacity>
              {showIncomeDate && (
                <DateTimePicker
                  value={incomeDate}
                  mode="date"
                  display="default"
                  onChange={(_: any, selectedDate?: Date) => {
                    setShowIncomeDate(false);
                    if (selectedDate) setIncomeDate(selectedDate);
                  }}
                />
              )}
              {/* Input Kategori */}
              <CustomText className="text-gray-600 mb-1">Kategori</CustomText>
              <View className="border rounded-lg mb-2" style={{ borderColor: activeInput === 'incomeCategory' ? '#22c55e' : '#d1d5db', borderWidth: 1 }}>
                <Picker
                  selectedValue={incomeCategory}
                  onValueChange={(value) => setIncomeCategory(value)}
                  style={{ height: 50 }}
                  onFocus={() => setActiveInput('incomeCategory')}
                  onBlur={() => setActiveInput(null)}
                >
                  <Picker.Item label="Main Income" value="main" />
                  <Picker.Item label="Side Income" value="side" />
                </Picker>
              </View>
              {/* Input Jumlah Uang */}
              <CustomText className="text-gray-600 mb-1">Jumlah Uang</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'incomeAmount' ? '#22c55e' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan jumlah"
                keyboardType="numeric"
                value={incomeAmount}
                onChangeText={setIncomeAmount}
                onFocus={() => setActiveInput('incomeAmount')}
                onBlur={() => setActiveInput(null)}
              />
              {/* Input Pajak */}
              <CustomText className="text-gray-600 mb-1">Pajak (%)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'incomeTax' ? '#22c55e' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan persen pajak (cth: 10)"
                keyboardType="numeric"
                value={incomeTax}
                onChangeText={setIncomeTax}
                onFocus={() => setActiveInput('incomeTax')}
                onBlur={() => setActiveInput(null)}
              />
              {/* Input Keterangan (opsional) */}
              <CustomText className="text-gray-600 mb-1">Keterangan (opsional)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'incomeDesc' ? '#22c55e' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan keterangan"
                value={incomeDesc}
                onChangeText={setIncomeDesc}
                onFocus={() => setActiveInput('incomeDesc')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          )}

          {tab === 'expense' && (
            <View className="bg-[#f6f6f7] rounded-2xl shadow p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="arrow-down-outline" size={22} color="#ef4444" style={{ marginRight: 8 }} />
                <CustomText className="text-lg font-bold" style={{ color: '#ef4444' }}>Pengeluaran</CustomText>
              </View>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 }} />
              {/* Input Tanggal */}
              <CustomText className="text-gray-600 mb-1">Tanggal</CustomText>
              <TouchableOpacity
                className="border rounded-lg p-3 mb-2 flex-row items-center"
                style={{ borderColor: activeInput === 'expenseDate' ? '#ef4444' : '#d1d5db', borderWidth: 1 }}
                onPress={() => { setShowExpenseDate(true); setActiveInput('expenseDate'); }}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <CustomText className="ml-2">{expenseDate ? expenseDate.toLocaleDateString('id-ID') : 'Pilih tanggal'}</CustomText>
              </TouchableOpacity>
              {showExpenseDate && (
                <DateTimePicker
                  value={expenseDate}
                  mode="date"
                  display="default"
                  onChange={(_: any, selectedDate?: Date) => {
                    setShowExpenseDate(false);
                    if (selectedDate) setExpenseDate(selectedDate);
                  }}
                />
              )}
              {/* Input Kategori */}
              <CustomText className="text-gray-600 mb-1">Kategori</CustomText>
              <View className="border rounded-lg mb-2" style={{ borderColor: activeInput === 'category' ? '#ef4444' : '#d1d5db', borderWidth: 1 }}>
                <Picker
                  selectedValue={category}
                  onValueChange={(value) => setCategory(value)}
                  style={{ height: 50 }}
                  onFocus={() => setActiveInput('category')}
                  onBlur={() => setActiveInput(null)}
                >
                  <Picker.Item label="Pilih kategori" value="" />
                  {EXPENSE_CATEGORIES.map((c) => (
                    <Picker.Item key={c.value} label={c.label} value={c.value} />
                  ))}
                </Picker>
              </View>
              {/* Input Jumlah Uang */}
              <CustomText className="text-gray-600 mb-1">Jumlah Uang</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'amount' ? '#ef4444' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan jumlah"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                onFocus={() => setActiveInput('amount')}
                onBlur={() => setActiveInput(null)}
              />
              {/* Input Keterangan (opsional) */}
              <CustomText className="text-gray-600 mb-1">Keterangan (opsional)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'description' ? '#ef4444' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan keterangan"
                value={description}
                onChangeText={setDescription}
                onFocus={() => setActiveInput('description')}
                onBlur={() => setActiveInput(null)}
              />
              <TouchableOpacity
                className="border rounded-lg p-4 bg-gray-50 flex-row items-center justify-between mb-2"
                onPress={pickDocument}
              >
                <View className="flex-row items-center">
                  <Ionicons name="document-attach-outline" size={24} color="#6B7280" />
                  <CustomText className="text-gray-600 ml-2">
                    {receipt?.name || 'Pilih Fail'}
                  </CustomText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {tab === 'asset' && (
            <View className="bg-[#f6f6f7] rounded-2xl shadow p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="cube-outline" size={22} color="#3b82f6" style={{ marginRight: 8 }} />
                <CustomText className="text-lg font-bold" style={{ color: '#3b82f6' }}>Aset</CustomText>
              </View>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 }} />
              {/* Nama Aset */}
              <CustomText className="text-gray-600 mb-1">Nama Aset</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'assetName' ? '#3b82f6' : '#d1d5db', borderWidth: 1 }}
                placeholder="Contoh: Kas, Piutang Usaha, Persediaan Barang, Laptop"
                value={assetName}
                onChangeText={setAssetName}
                onFocus={() => setActiveInput('assetName')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Nilai Aset */}
              <CustomText className="text-gray-600 mb-1">Nilai Aset (Rp)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'assetValue' ? '#3b82f6' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan nilai aset"
                keyboardType="numeric"
                value={assetValue}
                onChangeText={setAssetValue}
                onFocus={() => setActiveInput('assetValue')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Jenis Aset */}
              <CustomText className="text-gray-600 mb-1">Jenis Aset</CustomText>
              <View className="border rounded-lg mb-2" style={{ borderColor: activeInput === 'assetType' ? '#3b82f6' : '#d1d5db', borderWidth: 1 }}>
                <Picker
                  selectedValue={assetType}
                  onValueChange={(value) => setAssetType(value)}
                  style={{ height: 50 }}
                  onFocus={() => setActiveInput('assetType')}
                  onBlur={() => setActiveInput(null)}
                >
                  {ASSET_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>

              {/* Tanggal Perolehan */}
              <CustomText className="text-gray-600 mb-1">Tanggal Perolehan</CustomText>
              <TouchableOpacity
                className="border rounded-lg p-3 mb-2 flex-row items-center"
                style={{ borderColor: activeInput === 'assetDate' ? '#3b82f6' : '#d1d5db', borderWidth: 1 }}
                onPress={() => { setShowAssetDate(true); setActiveInput('assetDate'); }}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <CustomText className="ml-2">{assetDate.toLocaleDateString('id-ID')}</CustomText>
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
              <CustomText className="text-gray-600 mb-1">Keterangan (Opsional)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'assetDescription' ? '#3b82f6' : '#d1d5db', borderWidth: 1 }}
                placeholder="Tambahkan keterangan tentang aset"
                value={assetDescription}
                onChangeText={setAssetDescription}
                multiline
                numberOfLines={3}
                onFocus={() => setActiveInput('assetDescription')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          )}

          {tab === 'liability' && (
            <View className="bg-[#f6f6f7] rounded-2xl shadow p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="git-branch-outline" size={22} color="#f59e42" style={{ marginRight: 8 }} />
                <CustomText className="text-lg font-bold" style={{ color: '#f59e42' }}>Liabiliti</CustomText>
              </View>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 }} />
              {/* Nama Liabilitas */}
              <CustomText className="text-gray-600 mb-1">Nama Liabilitas</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'liabilityName' ? '#f59e42' : '#d1d5db', borderWidth: 1 }}
                placeholder="Contoh: Utang Dagang, Utang Gaji, Pinjaman Bank"
                value={liabilityName}
                onChangeText={setLiabilityName}
                onFocus={() => setActiveInput('liabilityName')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Nilai atau Jumlah */}
              <CustomText className="text-gray-600 mb-1">Nilai (Rp)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'liabilityValue' ? '#f59e42' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan jumlah kewajiban"
                keyboardType="numeric"
                value={liabilityValue}
                onChangeText={setLiabilityValue}
                onFocus={() => setActiveInput('liabilityValue')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Tanggal Pencatatan dan Jatuh Tempo */}
              <View className="flex-row justify-between mb-2">
                <View className="flex-1 mr-2">
                  <CustomText className="text-gray-600 mb-1">Tanggal Pencatatan</CustomText>
                  <TouchableOpacity
                    className="border rounded-lg p-3 flex-row items-center"
                    style={{ borderColor: activeInput === 'liabilityDate' ? '#f59e42' : '#d1d5db', borderWidth: 1 }}
                    onPress={() => { setShowLiabilityDate(true); setActiveInput('liabilityDate'); }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <CustomText className="ml-2">{liabilityDate.toLocaleDateString('id-ID')}</CustomText>
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
                <View className="flex-1 ml-2">
                  <CustomText className="text-gray-600 mb-1">Jatuh Tempo</CustomText>
                  <TouchableOpacity
                    className="border rounded-lg p-3 flex-row items-center"
                    style={{ borderColor: activeInput === 'liabilityDueDate' ? '#f59e42' : '#d1d5db', borderWidth: 1 }}
                    onPress={() => { setShowLiabilityDueDate(true); setActiveInput('liabilityDueDate'); }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <CustomText className="ml-2">{liabilityDueDate.toLocaleDateString('id-ID')}</CustomText>
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

              {/* Pihak Pemberi Pinjaman */}
              <CustomText className="text-gray-600 mb-1">Pihak Pemberi Pinjaman (Opsional)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'lender' ? '#f59e42' : '#d1d5db', borderWidth: 1 }}
                placeholder="Contoh: Bank ABC, Supplier XYZ"
                value={lender}
                onChangeText={setLender}
                onFocus={() => setActiveInput('lender')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Status Pembayaran */}
              <CustomText className="text-gray-600 mb-1">Status Pembayaran</CustomText>
              <View className="border rounded-lg mb-2" style={{ borderColor: activeInput === 'paymentStatus' ? '#f59e42' : '#d1d5db', borderWidth: 1 }}>
                <Picker
                  selectedValue={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value)}
                  style={{ height: 50 }}
                  onFocus={() => setActiveInput('paymentStatus')}
                  onBlur={() => setActiveInput(null)}
                >
                  {LIABILITY_STATUS.map((status) => (
                    <Picker.Item key={status.value} label={status.label} value={status.value} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {tab === 'equity' && (
            <View className="bg-[#f6f6f7] rounded-2xl shadow p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="people-outline" size={22} color="#a855f7" style={{ marginRight: 8 }} />
                <CustomText className="text-lg font-bold" style={{ color: '#a855f7' }}>Ekuiti</CustomText>
              </View>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 }} />
              {/* Nama Ekuiti */}
              <CustomText className="text-gray-600 mb-1">Nama Ekuiti</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'equityName' ? '#a855f7' : '#d1d5db', borderWidth: 1 }}
                placeholder="Contoh: Modal Disetor, Laba Ditahan, Prive"
                value={equityName}
                onChangeText={setEquityName}
                onFocus={() => setActiveInput('equityName')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Nilai Ekuiti */}
              <CustomText className="text-gray-600 mb-1">Nilai Ekuiti (Rp)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'equityValue' ? '#a855f7' : '#d1d5db', borderWidth: 1 }}
                placeholder="Masukkan nilai ekuiti"
                keyboardType="numeric"
                value={equityValue}
                onChangeText={setEquityValue}
                onFocus={() => setActiveInput('equityValue')}
                onBlur={() => setActiveInput(null)}
              />

              {/* Jenis Ekuiti */}
              <CustomText className="text-gray-600 mb-1">Jenis Ekuiti</CustomText>
              <View className="border rounded-lg mb-2" style={{ borderColor: activeInput === 'equityType' ? '#a855f7' : '#d1d5db', borderWidth: 1 }}>
                <Picker
                  selectedValue={equityType}
                  onValueChange={(value) => setEquityType(value)}
                  style={{ height: 50 }}
                  onFocus={() => setActiveInput('equityType')}
                  onBlur={() => setActiveInput(null)}
                >
                  {EQUITY_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>

              {/* Tanggal Transaksi */}
              <CustomText className="text-gray-600 mb-1">Tanggal Transaksi</CustomText>
              <TouchableOpacity
                className="border rounded-lg p-3 mb-2 flex-row items-center"
                style={{ borderColor: activeInput === 'equityDate' ? '#a855f7' : '#d1d5db', borderWidth: 1 }}
                onPress={() => { setShowEquityDate(true); setActiveInput('equityDate'); }}
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <CustomText className="ml-2">{equityDate.toLocaleDateString('id-ID')}</CustomText>
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
              <CustomText className="text-gray-600 mb-1">Keterangan (Opsional)</CustomText>
              <TextInput
                className="border rounded-lg p-3 mb-2"
                style={{ borderColor: activeInput === 'equityDescription' ? '#a855f7' : '#d1d5db', borderWidth: 1 }}
                placeholder="Contoh: Setoran modal tambahan bulan Mei"
                value={equityDescription}
                onChangeText={setEquityDescription}
                multiline
                numberOfLines={3}
                onFocus={() => setActiveInput('equityDescription')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          )}

          <TouchableOpacity className="bg-black p-4 rounded-full mt-4" onPress={handleSave}>
            <CustomText className="text-white text-center font-semibold text-base">Simpan</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 
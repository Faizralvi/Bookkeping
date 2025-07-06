import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../../components/CustomText';
import { assetAPI, equityAPI, incomeAPI, liabilityAPI, spendingAPI } from '../../lib/utils/api';
import { useLanguage } from '../contexts/LanguageContext';

// Tipe data entry (mirip BookkeepingEntry)
type BookkeepingEntry = {
  id?: string;
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
  liabilityType?: 'short-term' | 'long-term';
  dueDate?: string;
  lender?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  tax?: number;
  incomeTax?: number;
  currency?: string;
  assetName?: string;
};

type EditEntryModalProps = {
  visible: boolean;
  onClose: () => void;
  entry: BookkeepingEntry | null;
  onSave: (updated: BookkeepingEntry) => void;
};

export default function EditEntryModal({ visible, onClose, entry, onSave }: EditEntryModalProps) {
  const { getTranslation, convertToIDR, currency } = useLanguage();
  const [form, setForm] = useState<BookkeepingEntry | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showDueDate, setShowDueDate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Untuk liability: dua date picker dan perhitungan liabilityTerm
  const [liabilityDate, setLiabilityDate] = useState(entry?.date ? new Date(entry.date) : new Date());
  const [liabilityDueDate, setLiabilityDueDate] = useState(entry?.dueDate ? new Date(entry.dueDate) : new Date());
  const liabilityTerm = React.useMemo(() => {
    const diffTime = liabilityDueDate.getTime() - liabilityDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 365 ? 'long-term' : 'short-term';
  }, [liabilityDate, liabilityDueDate]);

  // Kategori dan tipe (harus sama dengan add.tsx)
  const EXPENSE_CATEGORIES = [
    { label: getTranslation('salary'), value: 'salary' },
    { label: getTranslation('utilities'), value: 'utilities' },
    { label: getTranslation('transport'), value: 'transport' },
    { label: getTranslation('packaging'), value: 'packaging' },
    { label: getTranslation('advertising'), value: 'advertising' },
    { label: getTranslation('license'), value: 'license' },
    { label: getTranslation('rent'), value: 'rent' },
    { label: getTranslation('others'), value: 'others' },
  ];
  const EQUITY_TYPES = [
    { label: getTranslation('initial'), value: 'initial' },
    { label: getTranslation('retained'), value: 'retained' },
    { label: getTranslation('withdrawal'), value: 'withdrawal' },
    { label: getTranslation('additional'), value: 'additional' },
  ];
  const ASSET_TYPES = [
    { label: getTranslation('current'), value: 'current' },
    { label: getTranslation('fixed'), value: 'fixed' },
  ];
  const FIXED_ASSET_CATEGORIES = [
    { label: getTranslation('building'), value: 'bangunan' },
    { label: getTranslation('vehicle'), value: 'kendaraan' },
    { label: getTranslation('equipment'), value: 'peralatan' },
    { label: getTranslation('machine'), value: 'mesin' },
    { label: getTranslation('fixed_investment'), value: 'investasi_tetap' },
  ];
  const CURRENT_ASSET_CATEGORIES = [
    { label: getTranslation('cash_in_hand'), value: 'cash_in_hand' },
    { label: getTranslation('cash_in_bank'), value: 'cash_in_bank' },
    { label: getTranslation('receivable'), value: 'penghutang' },
    { label: getTranslation('deposit'), value: 'deposit' },
    { label: getTranslation('inventory'), value: 'inventory' },
    { label: getTranslation('current_investment'), value: 'investasi_lancar' },
  ];
  const SHORT_TERM_LIABILITY_CATEGORIES = [
    { label: getTranslation('accountable'), value: 'accountable' },
    { label: getTranslation('monthly_loan'), value: 'monthly_loan' },
    { label: getTranslation('repayment'), value: 'repayment' },
    { label: getTranslation('others'), value: 'others' },
  ];
  const LONG_TERM_LIABILITY_CATEGORIES = [
    { label: getTranslation('bank_loan'), value: 'bank_loan' },
    { label: getTranslation('others'), value: 'others' },
  ];

  useEffect(() => {
    if (entry) {
      setForm({
        ...entry,
        name: entry.assetName || entry.name || '',
      });
      // Set tanggal liability dari entry
      if (entry.type === 'liability') {
        setLiabilityDate(entry.date ? new Date(entry.date) : new Date());
        setLiabilityDueDate(entry.dueDate ? new Date(entry.dueDate) : new Date());
      }
    }
  }, [entry]);

  // Reset kategori jika assetType berubah
  useEffect(() => {
    if (form && form.type === 'asset') {
      // Jika assetType berubah, reset kategori jika tidak cocok
      const validCats = (form.assetType === 'fixed' ? FIXED_ASSET_CATEGORIES : CURRENT_ASSET_CATEGORIES).map(c => c.value);
      if (form.category && !validCats.includes(form.category)) {
        setForm(f => f ? { ...f, category: '' } : f);
      }
    }
  }, [form?.assetType]);

  if (!form) return null;

  const handleChange = (key: keyof BookkeepingEntry, value: any) => {
    setForm(f => f ? { ...f, [key]: value } : f);
  };

  const handleSave = async () => {
    if (!form) return;
    // Validasi sederhana
    if (form.type === 'income' && (!form.amount || !form.category)) {
      Alert.alert('Error', 'Jumlah dan kategori pendapatan wajib diisi!');
      return;
    }
    if (form.type === 'expense' && (!form.amount || !form.category)) {
      Alert.alert('Error', 'Jumlah dan kategori pengeluaran wajib diisi!');
      return;
    }
    if (form.type === 'asset' && (!form.name || !form.value)) {
      Alert.alert('Error', 'Nama dan nilai aset wajib diisi!');
      return;
    }
    if (form.type === 'liability' && (!form.name || !form.value)) {
      Alert.alert('Error', 'Nama dan nilai liabilitas wajib diisi!');
      return;
    }
    if (form.type === 'equity' && (!form.name || !form.value)) {
      Alert.alert('Error', 'Nama dan nilai ekuiti wajib diisi!');
      return;
    }
    setLoading(true);
    try {
      if (form.type === 'liability') {
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(Number(form.value));
        await liabilityAPI.updateLiability(Number(form.id), {
          type: liabilityTerm,
          amount: amountInIDR,
          liabilityCategory: form.category || '',
          description: form.description || '',
        });
      } else if (form.type === 'income') {
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(Number(form.amount));
        await incomeAPI.updateIncome(Number(form.id), {
          type: form.category || '',
          amount: amountInIDR,
          description: form.description || '',
          tax: form.incomeTax || 0,
        });
      } else if (form.type === 'expense') {
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(Number(form.amount));
        await spendingAPI.updateSpending(Number(form.id), {
          spendingType: form.category || '',
          amount: amountInIDR,
          description: form.description || '',
        });
      } else if (form.type === 'asset') {
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(Number(form.value) || 0);
        // Validasi dan mapping field asset
        const assetPayload = {
          assetName: form.name || '',
          assetValue: amountInIDR,
          assetType: form.assetType || '',
          assetCategory: form.category || '',
          assetDate: form.date || '',
          assetDescription: form.description || '',
        };
        const response = await assetAPI.updateAsset(Number(form.id), assetPayload);
        if (!response || response.status === false || response.status === 'error') {
          throw new Error(response?.message || 'Gagal update asset');
        }
      } else if (form.type === 'equity') {
        // Convert amount from current currency to IDR for storage
        const amountInIDR = convertToIDR(Number(form.value));
        await equityAPI.updateEquity(Number(form.id), {
          equityName: form.name || '',
          equityType: form.category || '',
          amount: amountInIDR,
          description: form.description || '',
          equityDate: form.date || '',
        });
      }
      setLoading(false);
      onSave(form);
      onClose();
      Alert.alert(getTranslation('successTitle'), getTranslation('successSave'));
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || getTranslation('errorSave'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="bg-white rounded-2xl p-5 w-[90%] max-w-xl">
          <View className="flex-row justify-between items-center mb-4">
            <CustomText className="text-xl font-bold">{getTranslation('editData') || 'Edit Data'}</CustomText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 500 }}>
            {/* Tipe Income */}
            {form.type === 'income' && (
              <View
                className="bg-white rounded-2xl p-5 mb-6 border border-green-100"
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
                  style={{ borderColor: '#16a34a', borderWidth: 1 }}
                  onPress={() => setShowDate(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <CustomText className="ml-3 text-gray-800">{form.date ? new Date(form.date).toLocaleDateString('id-ID') : 'Pilih tanggal'}</CustomText>
                </TouchableOpacity>
                {showDate && (
                  <DateTimePicker
                    value={form.date ? new Date(form.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowDate(false);
                      if (selectedDate) handleChange('date', selectedDate.toISOString());
                    }}
                  />
                )}
                {/* Input Kategori */}
                <CustomText className="text-gray-700 mb-2 font-semibold">{getTranslation('category')}</CustomText>
                <View className="flex-row space-x-3 mb-5">
                  {['main', 'side'].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => handleChange('category', val)}
                      className={`flex-1 rounded-xl px-4 py-3 border text-center ${form.category === val ? 'border-[#16a34a] bg-[#ecfdf5]' : 'border-gray-300 bg-white'}`}
                      activeOpacity={0.85}
                    >
                      <CustomText className={`text-base font-medium ${form.category === val ? 'text-[#16a34a]' : 'text-gray-700'}`}>{val === 'main' ? 'Utama' : 'Tambahan'}</CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Input Jumlah Uang */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('amount')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3 mb-5"
                  style={{ borderColor: '#16a34a', borderWidth: 1 }}
                  placeholder={`${getTranslation('enterAmount')} (${currency})`}
                  keyboardType="numeric"
                  value={(form.amount ?? '').toString()}
                  onChangeText={v => handleChange('amount', v)}
                />
                {/* Input Pajak */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('tax')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3 mb-5"
                  style={{ borderColor: '#16a34a', borderWidth: 1 }}
                  placeholder={getTranslation('enterTax')}
                  keyboardType="numeric"
                  value={form.incomeTax !== undefined && form.incomeTax !== null ? form.incomeTax.toString() : ''}
                  onChangeText={v => handleChange('incomeTax', Number(v))}
                />
                {/* Input Keterangan */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('description')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3"
                  style={{ borderColor: '#16a34a', borderWidth: 1 }}
                  placeholder={getTranslation('enterDescription')}
                  value={form.description || ''}
                  onChangeText={v => handleChange('description', v)}
                />
              </View>
            )}
            {/* Tipe Expense */}
            {form.type === 'expense' && (
              <View
                className="bg-white rounded-2xl p-5 mb-6 border border-red-100"
                style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
              >
                <View className="flex-row items-center mb-4">
                  <Ionicons name="arrow-down-outline" size={22} color="#ef4444" style={{ marginRight: 8 }} />
                  <CustomText className="text-xl font-bold text-[#ef4444]">Pengeluaran</CustomText>
                </View>
                <View style={{ height: 1, backgroundColor: '#fecaca', marginBottom: 20 }} />
                {/* Input Tanggal */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('date')}</CustomText>
                <TouchableOpacity
                  className="flex-row items-center bg-white border rounded-xl px-4 py-3 mb-5"
                  style={{ borderColor: '#ef4444', borderWidth: 1 }}
                  onPress={() => setShowDate(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <CustomText className="ml-3 text-gray-800">{form.date ? new Date(form.date).toLocaleDateString('id-ID') : 'Pilih tanggal'}</CustomText>
                </TouchableOpacity>
                {showDate && (
                  <DateTimePicker
                    value={form.date ? new Date(form.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowDate(false);
                      if (selectedDate) handleChange('date', selectedDate.toISOString());
                    }}
                  />
                )}
                {/* Input Kategori */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('category')}</CustomText>
                <View
                  className="rounded-xl overflow-hidden mb-5"
                  style={{ borderColor: '#ef4444', borderWidth: 1, backgroundColor: '#fff' }}
                >
                  <Picker
                    selectedValue={form.category || ''}
                    onValueChange={v => handleChange('category', v)}
                    style={{ height: 50, color: form.category ? '#111827' : '#9ca3af' }}
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
                  style={{ borderColor: '#ef4444', borderWidth: 1 }}
                  placeholder={`${getTranslation('enterAmount')} (${currency})`}
                  keyboardType="numeric"
                  value={(form.amount ?? '').toString()}
                  onChangeText={v => handleChange('amount', v)}
                />
                {/* Input Keterangan */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('description')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3"
                  style={{ borderColor: '#ef4444', borderWidth: 1 }}
                  placeholder={getTranslation('enterDescription')}
                  value={form.description || ''}
                  onChangeText={v => handleChange('description', v)}
                />
              </View>
            )}
            {/* Tipe Asset */}
            {form.type === 'asset' && (
              <>
                {/* Nama Aset */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetName')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3 mb-5"
                  style={{ borderColor: '#3b82f6', borderWidth: 1 }}
                  placeholder={getTranslation('enterAssetName')}
                  value={form.name || ''}
                  onChangeText={v => handleChange('name', v)}
                />
                {/* Nilai Aset */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetValue')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3 mb-5"
                  style={{ borderColor: '#3b82f6', borderWidth: 1 }}
                  placeholder={`${getTranslation('enterAssetValue')} (${currency})`}
                  keyboardType="numeric"
                  value={(form.value ?? '').toString()}
                  onChangeText={v => handleChange('value', v)}
                />
                {/* Jenis Aset */}
                <CustomText className="text-gray-700 mb-2 font-semibold">{getTranslation('assetType')}</CustomText>
                <View className="flex-row space-x-3 mb-5">
                  {ASSET_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => handleChange('assetType', t.value)}
                      className={`flex-1 rounded-xl px-4 py-3 border text-center ${form.assetType === t.value ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-gray-300 bg-white'}`}
                      activeOpacity={0.8}
                    >
                      <CustomText className={`text-base font-medium ${form.assetType === t.value ? 'text-[#3b82f6]' : 'text-gray-700'}`}>{t.label}</CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Kategori Aset */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetCategory')}</CustomText>
                <View className="rounded-xl overflow-hidden mb-5 border border-gray-300 bg-white">
                  <Picker
                    selectedValue={form.category || ''}
                    onValueChange={v => handleChange('category', v)}
                    style={{ height: 50, color: form.category ? '#111827' : '#9ca3af' }}
                  >
                    <Picker.Item label={getTranslation('selectCategory')} value="" />
                    {(form.assetType === 'fixed' ? FIXED_ASSET_CATEGORIES : CURRENT_ASSET_CATEGORIES).map((cat) => (
                      <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                    ))}
                  </Picker>
                </View>
                {/* Tanggal Perolehan */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetDate')}</CustomText>
                <TouchableOpacity onPress={() => setShowDate(true)} className="flex-row items-center bg-white border rounded-xl px-4 py-3 mb-5" style={{ borderColor: '#3b82f6', borderWidth: 1 }}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <CustomText className="ml-3 text-gray-800">{form.date ? new Date(form.date).toLocaleDateString('id-ID') : '-'}</CustomText>
                </TouchableOpacity>
                {showDate && (
                  <DateTimePicker
                    value={form.date ? new Date(form.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowDate(false);
                      if (selectedDate) handleChange('date', selectedDate.toISOString());
                    }}
                  />
                )}
                {/* Keterangan */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('assetDescription')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3"
                  style={{ borderColor: '#3b82f6', borderWidth: 1 }}
                  placeholder={getTranslation('enterAssetDescription')}
                  value={form.description || ''}
                  onChangeText={v => handleChange('description', v)}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
            {/* Tipe Liability */}
            {form.type === 'liability' && (
              <>
                {/* Nama Liabilitas */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityName')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3 mb-5"
                  style={{ borderColor: '#f59e0b', borderWidth: 1 }}
                  placeholder={getTranslation('enterLiabilityName')}
                  value={form.name || ''}
                  onChangeText={v => handleChange('name', v)}
                />
                {/* Jumlah Utang */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityValue')}</CustomText>
                <TextInput
                  className="bg-white border rounded-xl px-4 py-3 mb-5"
                  style={{ borderColor: '#f59e0b', borderWidth: 1 }}
                  placeholder={`${getTranslation('enterLiabilityValue')} (${currency})`}
                  keyboardType="numeric"
                  value={(form.value ?? '').toString()}
                  onChangeText={v => handleChange('value', v)}
                />
                {/* Tanggal Pencatatan & Jatuh Tempo */}
                <View className="flex-row justify-between mb-5 space-x-3">
                  {/* Tanggal Pencatatan */}
                  <View className="flex-1">
                    <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityDate')}</CustomText>
                    <TouchableOpacity
                      className="flex-row items-center bg-white border rounded-xl px-4 py-3"
                      style={{ borderColor: '#f59e0b', borderWidth: 1 }}
                      onPress={() => setShowDate(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                      <CustomText className="ml-3 text-gray-800">
                        {liabilityDate ? liabilityDate.toLocaleDateString('id-ID') : '-'}
                      </CustomText>
                    </TouchableOpacity>
                    {showDate && (
                      <DateTimePicker
                        value={liabilityDate}
                        mode="date"
                        display="default"
                        onChange={(_, selectedDate) => {
                          setShowDate(false);
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
                      style={{ borderColor: '#f59e0b', borderWidth: 1 }}
                      onPress={() => setShowDueDate(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                      <CustomText className="ml-3 text-gray-800">
                        {liabilityDueDate ? liabilityDueDate.toLocaleDateString('id-ID') : '-'}
                      </CustomText>
                    </TouchableOpacity>
                    {showDueDate && (
                      <DateTimePicker
                        value={liabilityDueDate}
                        mode="date"
                        display="default"
                        onChange={(_, selectedDate) => {
                          setShowDueDate(false);
                          if (selectedDate) setLiabilityDueDate(selectedDate);
                        }}
                      />
                    )}
                  </View>
                </View>
                {/* Kategori */}
                <CustomText className="text-gray-700 mb-1 font-semibold">{getTranslation('liabilityCategory')}</CustomText>
                <View className="rounded-xl overflow-hidden mb-2" style={{ borderColor: '#f59e0b', borderWidth: 1, backgroundColor: '#fff' }}>
                  <Picker
                    selectedValue={form.category || ''}
                    onValueChange={v => handleChange('category', v)}
                    style={{ height: 50, color: form.category ? '#111827' : '#9ca3af' }}
                  >
                    <Picker.Item label={getTranslation('selectCategory')} value="" />
                    {(liabilityTerm === 'short-term' ? SHORT_TERM_LIABILITY_CATEGORIES : LONG_TERM_LIABILITY_CATEGORIES).map((cat) => (
                      <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                    ))}
                  </Picker>
                </View>
                
              </>
            )}
            {/* Tipe Equity */}
            {form.type === 'equity' && (
              <>
                <CustomText className="mb-1">{getTranslation('equityName')}</CustomText>
                <TextInput
                  className="border rounded-xl px-4 py-2 mb-3"
                  value={form.name || ''}
                  onChangeText={v => handleChange('name', v)}
                />
                <CustomText className="mb-1">{getTranslation('equityValue')}</CustomText>
                <TextInput
                  className="border rounded-xl px-4 py-2 mb-3"
                  keyboardType="numeric"
                  placeholder={`${getTranslation('enterEquityValue')} (${currency})`}
                  value={(form.value ?? '').toString()}
                  onChangeText={v => handleChange('value', v)}
                />
                <CustomText className="mb-1">{getTranslation('equityType')}</CustomText>
                <View className="rounded-xl overflow-hidden mb-3 border border-gray-300 bg-white">
                  <Picker
                    selectedValue={form.category || ''}
                    onValueChange={v => handleChange('category', v)}
                    style={{ height: 50, color: form.category ? '#111827' : '#9ca3af' }}
                  >
                    <Picker.Item label={getTranslation('selectCategory')} value="" />
                    {EQUITY_TYPES.map((type) => (
                      <Picker.Item key={type.value} label={type.label} value={type.value} />
                    ))}
                  </Picker>
                </View>
                <CustomText className="mb-1">{getTranslation('equityDescription')}</CustomText>
                <TextInput
                  className="border rounded-xl px-4 py-2 mb-3"
                  value={form.description || ''}
                  onChangeText={v => handleChange('description', v)}
                />
                <CustomText className="mb-1">{getTranslation('equityDate')}</CustomText>
                <TouchableOpacity onPress={() => setShowDate(true)} className="mb-3 flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <CustomText className="ml-2">{form.date ? new Date(form.date).toLocaleDateString('id-ID') : '-'}</CustomText>
                </TouchableOpacity>
                {showDate && (
                  <DateTimePicker
                    value={form.date ? new Date(form.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowDate(false);
                      if (selectedDate) handleChange('date', selectedDate.toISOString());
                    }}
                  />
                )}
              </>
            )}
          </ScrollView>
          <TouchableOpacity onPress={handleSave} className="bg-black rounded-full py-3 mt-4" disabled={loading}>
            <CustomText className="text-white text-center font-semibold">{loading ? getTranslation('loading') || 'Menyimpan...' : getTranslation('saveChanges') || 'Simpan Perubahan'}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 
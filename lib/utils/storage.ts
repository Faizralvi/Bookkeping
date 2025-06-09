import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  INCOME: '@bookkeeping_income',
  EXPENSES: '@bookkeeping_expenses',
  ASSETS: '@bookkeeping_assets',
  LIABILITIES: '@bookkeeping_liabilities',
  CASH_FLOW: '@bookkeeping_cash_flow',
};

const ENTRIES_KEY = '@bookkeeping_entries';

// Income storage
export const saveIncome = async (data: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving income:', error);
  }
};

export const getIncome = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INCOME);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting income:', error);
    return null;
  }
};

// Expenses storage
export const saveExpenses = async (data: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving expenses:', error);
  }
};

export const getExpenses = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting expenses:', error);
    return null;
  }
};

// Assets storage
export const saveAssets = async (data: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving assets:', error);
  }
};

export const getAssets = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting assets:', error);
    return null;
  }
};

// Liabilities storage
export const saveLiabilities = async (data: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LIABILITIES, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving liabilities:', error);
  }
};

export const getLiabilities = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIABILITIES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting liabilities:', error);
    return null;
  }
};

// Cash flow storage
export const saveCashFlow = async (data: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CASH_FLOW, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cash flow:', error);
  }
};

export const getCashFlow = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CASH_FLOW);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cash flow:', error);
    return null;
  }
};

// Entries storage
export const getEntries = async () => {
  try {
    const data = await AsyncStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

export const saveEntries = async (newEntries: any[]) => {
  try {
    const data = await AsyncStorage.getItem(ENTRIES_KEY);
    const entries = data ? JSON.parse(data) : [];
    const updated = [...entries, ...newEntries];
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving entries:', error);
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}; 
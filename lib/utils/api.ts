import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your actual API URL here
const API_BASE_URL = 'http://20.214.51.17:5001/api'; // Ganti dengan IP address komputer Anda

// Helper function to get auth token
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('@auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Auth API calls
export const authAPI = {
  register: async (data: { name: string; email: string; password: string; role: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
};

// Income API calls
export const incomeAPI = {
  getIncome: async (type?: string, filter?: string) => {
    const token = await getAuthToken();
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (filter) queryParams.append('filter', filter);

    const response = await fetch(`${API_BASE_URL}/income?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch income data';
      try {
        const errorData = await response.json();
        console.error("Income API Error Response:", errorData);
        errorMessage = errorData.message || `API Error: ${response.status}`;
      } catch (e) {
        errorMessage = response.statusText || `API Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("--- Raw Income Data from API ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("---------------------------------");
    return data;
  },

  createIncome: async (data: { type: string; amount: number; description?: string; tax?: number; incomeDate?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/income`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    console.log('Income API response:', resData, response.status);
    if (!response.ok) {
      throw new Error(resData.message || 'Failed to save income');
    }
    return resData;
  },

  updateIncome: async (id: number, data: { type: string; amount: number; description?: string; tax?: number }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/income/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteIncome: async (id: number) => {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/income/${id}`;
    console.log('DELETE Income URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete income');
    }
    
    // Handle empty response
    const text = await response.text();
    if (!text) {
      return { success: true, message: 'Deleted successfully' };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: true, message: 'Deleted successfully' };
    }
  },
};

// Liability API calls
export const liabilityAPI = {
  getLiabilities: async () => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/liability`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch liabilities data';
      try {
        const errorData = await response.json();
        console.error("Liability API Error Response:", errorData);
        errorMessage = errorData.message || `API Error: ${response.status}`;
      } catch (e) {
        errorMessage = response.statusText || `API Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("--- Raw Liability Data from API ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("---------------------------------");
    return data;
  },

  createLiability: async (data: { liabilityName: string; liabilityAmount: number; liabilityType: string; liabilityCategory: string; liabilityDate: string; liabilityDescription?: string; createdAt?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/liability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    console.log('Liability API response:', resData, response.status);
    if (!response.ok) {
      throw new Error(resData.message || 'Failed to save liability');
    }
    return resData;
  },

  updateLiability: async (id: number, data: { type: string; amount: number; liabilityCategory: string; description?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/liability/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteLiability: async (id: number) => {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/liability/${id}`;
    console.log('DELETE Liability URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete liability');
    }
    
    // Handle empty response
    const text = await response.text();
    if (!text) {
      return { success: true, message: 'Deleted successfully' };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: true, message: 'Deleted successfully' };
    }
  },
};

// Spending API calls
export const spendingAPI = {
  getSpending: async () => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/spend`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch spending data';
      try {
        const errorData = await response.json();
        console.error("Spending API Error Response:", errorData);
        errorMessage = errorData.message || `API Error: ${response.status}`;
      } catch (e) {
        errorMessage = response.statusText || `API Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("--- Raw Spending Data from API ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("---------------------------------");
    return data;
  },

  createSpending: async (data: { spendingType: string; amount: number; description?: string; spendDate?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/spend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateSpending: async (id: number, data: { spendingType: string; amount: number; description?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/spend/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteSpending: async (id: number) => {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/spend/${id}`;
    console.log('DELETE Spending URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete spending');
    }
    
    // Handle empty response
    const text = await response.text();
    if (!text) {
      return { success: true, message: 'Deleted successfully' };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: true, message: 'Deleted successfully' };
    }
  },
};

// Asset API calls
export const assetAPI = {
  getAssets: async () => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/assets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch assets data';
      try {
        const errorData = await response.json();
        console.error("Asset API Error Response:", errorData);
        errorMessage = errorData.message || `API Error: ${response.status}`;
      } catch (e) {
        errorMessage = response.statusText || `API Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("--- Raw Asset Data from API ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("---------------------------------");
    return data;
  },

  createAsset: async (data: { assetName: string; assetValue: number; assetType: string; assetCategory: string; assetDate: string; assetDescription?: string; createdAt?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    console.log('Asset API response:', resData, response.status);
    if (!response.ok) {
      throw new Error(resData.message || 'Failed to save asset');
    }
    return resData;
  },

  updateAsset: async (id: number, data: { assetName: string; assetValue: number; assetType: string; assetCategory: string; assetDate: string; assetDescription?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteAsset: async (id: number) => {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/assets/${id}`;
    console.log('DELETE Asset URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete asset');
    }
    
    // Handle empty response
    const text = await response.text();
    if (!text) {
      return { success: true, message: 'Deleted successfully' };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: true, message: 'Deleted successfully' };
    }
  },
};

// Equity API calls
export const equityAPI = {
  getEquities: async () => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/equity`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch equities data';
      try {
        const errorData = await response.json();
        console.error("Equity API Error Response:", errorData);
        errorMessage = errorData.message || `API Error: ${response.status}`;
      } catch (e) {
        errorMessage = response.statusText || `API Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("--- Raw Equity Data from API ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("---------------------------------");
    return data;
  },

  createEquity: async (data: { equityName: string; equityType: string; amount: number; description?: string; equityDate: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/equity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateEquity: async (id: number, data: { equityName: string; equityType: string; amount: number; description?: string; equityDate: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/equity/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteEquity: async (id: number) => {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/equity/${id}`;
    console.log('DELETE Equity URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete equity');
    }
    
    // Handle empty response
    const text = await response.text();
    if (!text) {
      return { success: true, message: 'Deleted successfully' };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: true, message: 'Deleted successfully' };
    }
  },
};

// Expense API calls
export const expenseAPI = {
  getExpenses: async () => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/expense`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch expenses data';
      try {
        const errorData = await response.json();
        console.error("Expense API Error Response:", errorData);
        errorMessage = errorData.message || `API Error: ${response.status}`;
      } catch (e) {
        errorMessage = response.statusText || `API Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("--- Raw Expense Data from API ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("---------------------------------");
    return data;
  },

  createExpense: async (data: { expenseType: string; amount: number; description?: string; expenseDate?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateExpense: async (id: number, data: { expenseType: string; amount: number; description?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteExpense: async (id: number) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete expense');
    }
    
    // Handle empty response
    const text = await response.text();
    if (!text) {
      return { success: true, message: 'Deleted successfully' };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: true, message: 'Deleted successfully' };
    }
  },
};

// User API calls
export const userAPI = {
  getProfile: async () => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  updateProfile: async (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
}; 
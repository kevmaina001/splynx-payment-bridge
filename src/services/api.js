import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const paymentAPI = {
  // Get all payments with pagination
  getPayments: async (limit = 50, offset = 0) => {
    const response = await api.get('/payments', {
      params: { limit, offset }
    })
    return response.data
  },

  // Get specific payment by transaction ID
  getPayment: async (transactionId) => {
    const response = await api.get(`/payments/${transactionId}`)
    return response.data
  },

  // Get payments by client ID
  getClientPayments: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/payments`)
    return response.data
  },

  // Get client info from UISP
  getClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}`)
    return response.data
  },

  // Get UISP payment history for client
  getUISPClientPayments: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/uisp-payments`)
    return response.data
  },

  // Get payment statistics
  getStats: async () => {
    const response = await api.get('/stats')
    return response.data
  },

  // Health check
  health: async () => {
    const response = await api.get('/health')
    return response.data
  }
}

export const clientAPI = {
  // Get all clients from local database
  getClients: async (limit = 100, offset = 0, search = '', filters = {}) => {
    const params = { limit, offset };

    if (search) {
      params.search = search;
    }

    if (filters.is_active !== undefined) {
      params.is_active = filters.is_active;
    }

    if (filters.is_suspended !== undefined) {
      params.is_suspended = filters.is_suspended;
    }

    const response = await api.get('/clients', { params });
    return response.data;
  },

  // Get client statistics
  getClientStats: async () => {
    const response = await api.get('/clients/stats')
    return response.data
  },

  // Trigger full client sync from UISP
  syncClients: async (wait = false) => {
    const endpoint = wait ? '/clients/sync/wait' : '/clients/sync'
    const response = await api.post(endpoint)
    return response.data
  },

  // Sync a single client
  syncClient: async (clientId) => {
    const response = await api.post(`/clients/${clientId}/sync`)
    return response.data
  },

  // Get sync logs
  getSyncLogs: async (limit = 10) => {
    const response = await api.get('/sync/logs', {
      params: { limit }
    })
    return response.data
  }
}

export default api

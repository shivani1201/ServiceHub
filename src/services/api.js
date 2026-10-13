import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const TOKEN_KEY = 'servicehub_token';
export const USER_KEY = 'servicehub_user';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

const data = (request) => request.then((response) => response.data);

export const authAPI = {
  register: (payload) => data(api.post('/auth/register', payload)),
  login: (payload) => data(api.post('/auth/login', payload)),
};

export const userAPI = {
  getProfile: () => data(api.get('/users/profile')),
  updateProfile: (formData) => data(api.put('/users/profile', formData)),
  changePassword: (payload) => data(api.put('/users/password', payload)),
};

export const categoryAPI = {
  getAll: () => data(api.get('/categories')),
};

export const serviceAPI = {
  getAll: (params) => data(api.get('/services', { params })),
  getById: (id) => data(api.get(`/services/${id}`)),
  getMine: () => data(api.get('/services/my')),
  create: (formData) => data(api.post('/services', formData)),
  update: (id, formData) => data(api.put(`/services/${id}`, formData)),
  toggle: (id) => data(api.put(`/services/${id}/toggle`)),
  remove: (id) => data(api.delete(`/services/${id}`)),
};

export const providerAPI = {
  getAll: (params) => data(api.get('/providers', { params })),
  getById: (id) => data(api.get(`/providers/${id}`)),
  getSlots: (id, date) => data(api.get(`/providers/${id}/slots`, { params: { date } })),
};

export const bookingAPI = {
  create: (payload) => data(api.post('/bookings', payload)),
  getMine: () => data(api.get('/bookings/my')),
  getForProvider: () => data(api.get('/bookings/provider')),
  updateStatus: (id, status) => data(api.put(`/bookings/${id}`, { status })),
  remove: (id) => data(api.delete(`/bookings/${id}`)),
};

export const reviewAPI = {
  getForProvider: (providerId) => data(api.get(`/reviews/provider/${providerId}`)),
  getForService: (serviceId) => data(api.get(`/reviews/service/${serviceId}`)),
  create: (payload) => data(api.post('/reviews', payload)),
};

export default api;

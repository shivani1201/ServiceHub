import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const TOKEN_KEY = 'servicehub_admin_token';
export const USER_KEY = 'servicehub_admin_user';

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
const toFormData = (payload = {}) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  return formData;
};

export const authAPI = {
  adminLogin: (payload) => data(api.post('/auth/admin-login', payload)),
};

export const dashboardAPI = {
  getStats: () => data(api.get('/admin/dashboard')),
};

export const userAPI = {
  getProfile: () => data(api.get('/users/profile')),
  changePassword: (payload) => data(api.put('/users/password', payload)),
  getAll: () => data(api.get('/users')),
  getById: (id) => data(api.get(`/users/${id}`)),
  toggleActive: (id) => data(api.put(`/users/${id}/toggle-active`)),
  remove: (id) => data(api.delete(`/users/${id}`)),
};

export const providerAPI = {
  getAllAdmin: (status) => data(api.get('/providers/admin/all', { params: status ? { status } : {} })),
  getById: (id) => data(api.get(`/providers/${id}`)),
  update: (id, payload) => data(api.put(`/providers/${id}`, toFormData(payload))),
  approve: (id) => data(api.put(`/providers/${id}/approve`)),
  reject: (id) => data(api.put(`/providers/${id}/reject`)),
  toggleActive: (id) => data(api.put(`/providers/${id}/toggle-active`)),
  remove: (id) => data(api.delete(`/providers/${id}`)),
};

export const categoryAPI = {
  getAllAdmin: () => data(api.get('/categories/admin/all')),
  create: (payload) => data(api.post('/categories', toFormData(payload))),
  update: (id, payload) => data(api.put(`/categories/${id}`, toFormData(payload))),
  toggleActive: (id) => data(api.put(`/categories/${id}/toggle-active`)),
  remove: (id) => data(api.delete(`/categories/${id}`)),
};

export const serviceAPI = {
  getAllAdmin: () => data(api.get('/services/admin/all')),
  create: (payload) => data(api.post('/services', toFormData(payload))),
  update: (id, payload) => data(api.put(`/services/${id}`, toFormData(payload))),
  toggle: (id) => data(api.put(`/services/${id}/toggle`)),
  remove: (id) => data(api.delete(`/services/${id}`)),
};

export const bookingAPI = {
  getAll: (status) => data(api.get('/bookings', { params: status ? { status } : {} })),
  updateStatus: (id, status) => data(api.put(`/bookings/${id}`, { status })),
  remove: (id) => data(api.delete(`/bookings/${id}`)),
};

export const reviewAPI = {
  getAll: () => data(api.get('/reviews')),
  remove: (id) => data(api.delete(`/reviews/${id}`)),
};

export default api;

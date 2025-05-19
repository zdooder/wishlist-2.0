import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// User endpoints
export const users = {
  getAll: () => api.get('/users'),
  getProfile: () => api.get('/users/profile'),
  approve: (id: string) => api.post(`/users/${id}/approve`),
  block: (email: string) => api.post(`/users/block/${email}`),
  unblock: (userId: string) => api.delete(`/users/block/${userId}`),
  getBlocked: () => api.get('/users/blocked'),
  getPendingCount: () => api.get('/users/pending-count'),
  delete: (id: string) => api.delete(`/users/${id}`),
  deactivate: (id: string) => api.post(`/users/${id}/deactivate`),
  reactivate: (id: string) => api.post(`/users/${id}/reactivate`),
  toggleAdmin: (id: string) => api.post(`/users/${id}/toggle-admin`),
};

// Wishlist endpoints
export const wishlists = {
  create: (data: { name: string; description?: string }) =>
    api.post('/wishlists', data),
  getMyWishlists: () => api.get('/wishlists/my-wishlists'),
  getAll: () => api.get('/wishlists'),
  getById: (id: string) => api.get(`/wishlists/${id}`),
  update: (id: string, data: { name: string; description?: string }) =>
    api.put(`/wishlists/${id}`, data),
  delete: (id: string) => api.delete(`/wishlists/${id}`),
};

// Item endpoints
interface CreateItemData {
  name: string;
  description?: string;
  price: number;
  url?: string;
  imageUrl?: string;
  imageData?: string;
  wishlistId: string;
}

interface UpdateItemData {
  name?: string;
  description?: string;
  price?: number;
  url?: string;
  imageUrl?: string;
  imageData?: string;
}

export const items = {
  create: (data: CreateItemData) => api.post('/items', data),
  update: (id: string, data: UpdateItemData) => api.put(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
  addComment: (id: string, data: { content: string }) =>
    api.post(`/items/${id}/comments`, data),
  updateComment: (itemId: string, commentId: string, data: { content: string }) =>
    api.put(`/items/${itemId}/comments/${commentId}`, data),
  deleteComment: (itemId: string, commentId: string) =>
    api.delete(`/items/${itemId}/comments/${commentId}`),
  reserve: (id: string) => api.post(`/items/${id}/reserve`),
  clearReservation: (id: string) => api.delete(`/items/${id}/reserve`),
  markAsPurchased: (id: string) => api.put(`/items/${id}/purchase`),
  clearPurchase: (id: string) => api.delete(`/items/${id}/purchase`),
};

export default {
  auth,
  users,
  wishlists,
  items,
}; 
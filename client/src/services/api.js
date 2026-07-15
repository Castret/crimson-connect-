import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Profile
export const profileService = {
  getCurrent: () => api.get('/profile'),
  getById: (id) => api.get(`/profile/${id}`),
  update: (data) => api.put('/profile', data),
};

// Blood Bank / Donation Operations
export const bloodService = {
  getInventory: () => api.get('/blood/inventory'),
  addInventory: (data) => api.post('/blood/inventory', data),
  updateInventory: (id, data) => api.patch(`/blood/inventory/${id}`, data),
  deleteInventory: (id) => api.delete(`/blood/inventory/${id}`),
  getRequests: () => api.get('/blood/requests'),
  createRequest: (data) => api.post('/blood/requests', data),
  updateRequestStatus: (id, status) => api.put(`/blood/requests/${id}`, { status }),
  getAppointments: () => api.get('/blood/appointments'),
  scheduleAppointment: (data) => api.post('/blood/appointments', data),
  updateAppointmentStatus: (id, status) => api.put(`/blood/appointments/${id}`, { status }),
  getDonors: () => api.get('/blood/donors'),
  getBloodbanks: () => api.get('/blood/banks'),
  getMatchingRequests: () => api.get('/blood/matching-requests'),
  getDonationHistory: () => api.get('/blood/donation-history'),
  createDonationHistory: (data) => api.post('/blood/donation-history', data),
  updateDonorAvailability: (isAvailable) => api.patch('/blood/donor-availability', { isAvailable }),
};

// Emergency Support
export const emergencyService = {
  createRequest: (data) => api.post('/blood/emergency', data),
  getRequests: (params) => api.get('/blood/emergency', { params }),
  createChatEmergency: (data) => api.post('/emergency-requests', data),
  fulfillChatEmergency: (id) => api.patch(`/emergency-requests/${id}/fulfill`),
  getOwnChatEmergencies: () => api.get('/emergency-requests/own'),
};

// Chats
export const chatService = {};

// Admin
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getLogs: () => api.get('/admin/logs'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
};

// Notifications
export const notificationService = {
  getAll: () => api.get('/notifications'),
};

export default api;

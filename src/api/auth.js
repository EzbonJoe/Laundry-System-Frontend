import api from './axios';

export const login         = (data)       => api.post('/auth/login', data);
export const logout        = ()           => api.post('/auth/logout');
export const getMe         = ()           => api.get('/auth/me');
export const changePassword= (data)       => api.put('/auth/change-password', data);
export const resetPassword = (data)       => api.post('/auth/reset-password', data);
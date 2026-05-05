// src/api/notifications.js
import api from './axios';

export const getMyNotifications    = ()   => api.get('/notifications');
export const markRead              = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead           = ()   => api.patch('/notifications/read-all');
export const deleteNotification    = (id) => api.delete(`/notifications/${id}`);
// src/api/auditLogs.js
import api from './axios';

export const getAllLogs       = (params)   => api.get('/audit-logs', { params });
export const getLogsByUser   = (userId)   => api.get(`/audit-logs/user/${userId}`);
export const getLogsByBranch = (branchId) => api.get(`/audit-logs/branch/${branchId}`);
// src/api/machines.js
import api from './axios';

export const getMachines        = (params)      => api.get('/machines', { params });
export const getMachinesByBranch= (branchId)    => api.get(`/machines/branch/${branchId}`);
export const addMachine         = (data)        => api.post('/machines', data);
export const updateMachineStatus= (id, status)  => api.patch(`/machines/${id}/status`, { status });
export const logMachineUsage    = (id, data)    => api.post(`/machines/${id}/usage`, data);
export const getMachineHistory  = (id)          => api.get(`/machines/${id}/history`);
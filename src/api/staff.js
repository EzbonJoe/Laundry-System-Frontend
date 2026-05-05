import api from './axios';

export const getStaff          = (params)     => api.get('/users', { params });
export const getStaffByBranch  = (branchId)   => api.get(`/users/branch/${branchId}`);
export const getStaffMember    = (id)         => api.get(`/users/${id}`);
export const createStaff       = (data)       => api.post('/auth/register', data);
export const updateStaff       = (id, data)   => api.put(`/users/${id}`, data);
export const deactivateUser    = (id)         => api.delete(`/users/${id}`);
export const reactivateUser    = (id)         => api.patch(`/users/${id}/reactivate`);
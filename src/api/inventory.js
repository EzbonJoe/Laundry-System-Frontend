import api from './axios';

export const getInventory        = (params)    => api.get('/inventory', { params });
export const getInventoryByBranch= (branchId)  => api.get(`/inventory/branch/${branchId}`);
export const getLowStock         = ()          => api.get('/inventory/alerts/low-stock');
export const getUsageReport      = (params)    => api.get('/inventory/report/usage', { params });
export const addItem             = (data)      => api.post('/inventory', data);
export const updateStock         = (id, data)  => api.patch(`/inventory/${id}/stock`, data);
export const useStock            = (id, data)  => api.post(`/inventory/${id}/use`, data);
export const restockItem         = (id, data)  => api.post(`/inventory/${id}/restock`, data);
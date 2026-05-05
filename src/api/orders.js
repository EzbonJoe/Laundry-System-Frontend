import api from './axios';

export const getOrders           = (params)      => api.get('/orders', { params });
export const getOrder            = (id)          => api.get(`/orders/${id}`);
export const getOrdersByBranch   = (branchId)    => api.get(`/orders/branch/${branchId}`);
export const getOrdersByCustomer = (customerId)  => api.get(`/orders/customer/${customerId}`);
export const createOrder         = (data)        => api.post('/orders', data);
export const updateStatus        = (id, status)  => api.patch(`/orders/${id}/status`, { status });
export const collectOrder        = (id)          => api.patch(`/orders/${id}/collect`);
export const deleteOrder         = (id)          => api.delete(`/orders/${id}`);
export const getUncollected      = ()            => api.get('/orders/uncollected');
import api from './axios';

export const getCustomers        = (params)    => api.get('/customers', { params });
export const getCustomer         = (id)        => api.get(`/customers/${id}`);
export const getLoyalCustomers   = (params)    => api.get('/customers/status/loyal', { params });
export const getInactiveCustomers= (params)    => api.get('/customers/status/inactive', { params });
export const createCustomer      = (data)      => api.post('/customers', data);
export const updateCustomer      = (id, data)  => api.put(`/customers/${id}`, data);
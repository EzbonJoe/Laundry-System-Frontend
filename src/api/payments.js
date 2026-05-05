import api from './axios';

export const getPayments         = (params)      => api.get('/payments', { params });
export const recordPayment       = (data)        => api.post('/payments', data);
export const getOrderPayments    = (orderId)     => api.get(`/payments/order/${orderId}`);
export const getPaymentsByBranch = (branchId)    => api.get(`/payments/branch/${branchId}`);
export const getReceipt          = (id)          => api.get(`/payments/${id}/receipt`);
export const flagPayment         = (id, reason)  => api.patch(`/payments/${id}/flag`, { reason });
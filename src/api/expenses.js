import api from './axios';

export const getExpenses          = (params)    => api.get('/expenses', { params });
export const getExpensesByCategory= (params)    => api.get('/expenses/by-category', { params });
export const getExpensesByBranch  = (branchId)  => api.get(`/expenses/branch/${branchId}`);
export const createExpense        = (data)      => api.post('/expenses', data);
export const deleteExpense        = (id)        => api.delete(`/expenses/${id}`);
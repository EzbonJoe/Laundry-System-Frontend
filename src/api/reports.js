import api from './axios';

export const getGlobalDashboard   = ()       => api.get('/reports/dashboard');
export const getBranchDashboard   = (id)     => api.get(`/reports/dashboard/branch/${id}`);
export const getRevenueReport     = (params) => api.get('/reports/revenue', { params });
export const getProfitLoss        = (params) => api.get('/reports/profit-loss', { params });
export const getStaffActivity     = (params) => api.get('/reports/staff-activity', { params });
export const getFraudRisk         = ()       => api.get('/reports/fraud-risk');
export const getUncollectedReport = (params) => api.get('/reports/uncollected', { params });
export const getCustomerReport    = (params) => api.get('/reports/customers', { params });
export const getInventoryReport   = (params) => api.get('/reports/inventory', { params });
export const getExpensesReport    = (params) => api.get('/reports/expenses', { params });
// src/api/feedback.js
import api from './axios';

export const submitFeedback       = (data)     => api.post('/feedback', data);
export const getFeedbackByBranch  = (branchId) => api.get(`/feedback/branch/${branchId}`);
export const getFeedbackByOrder   = (orderId)  => api.get(`/feedback/order/${orderId}`);
export const getAverageRating     = (params)   => api.get('/feedback/ratings', { params });
export const markFeedbackReviewed = (id)       => api.patch(`/feedback/${id}/reviewed`);
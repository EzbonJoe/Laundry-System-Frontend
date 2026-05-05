import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import LoginPage        from './pages/auth/LoginPage';
import HQDashboard      from './pages/hq-admin/HQDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import StaffDashboard   from './pages/staff/StaffDashboard';
import OrdersPage from './pages/orders/OrdersPage';
import PaymentsPage from './pages/payments/PaymentsPage'
import InventoryPage from './pages/inventory/InventoryPage';
import CustomersPage from './pages/customers/CustomersPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import ReportsPage from './pages/reports/ReportsPage';
import BranchesPage from './pages/hq-admin/BranchesPage';
import StaffPage    from './pages/hq-admin/StaffPage';
import AuditLogsPage from './pages/hq-admin/AuditLogsPage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import MachinesPage from './pages/machines/MachinesPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import POSPage from './pages/pos/POSPage';

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to='/login' replace />;
  if (user.role === 'hq_admin')        return <Navigate to='/hq/dashboard' replace />;
  if (user.role === 'branch_manager')  return <Navigate to='/manager/dashboard' replace />;
  return <Navigate to='/staff/dashboard' replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/' element={<RoleRedirect />} />

      <Route path='/hq/dashboard' element={
        <ProtectedRoute roles={['hq_admin']}>
          <HQDashboard />
        </ProtectedRoute>
      } />

      <Route path='/manager/dashboard' element={
        <ProtectedRoute roles={['branch_manager']}>
          <ManagerDashboard />
        </ProtectedRoute>
      } />

      <Route path='/staff/dashboard' element={
        <ProtectedRoute roles={['staff']}>
          <StaffDashboard />
        </ProtectedRoute>
      } />

      <Route path='/unauthorized' element={
        <div className='flex items-center justify-center h-screen text-red-500 text-xl'>
          You are not authorized to view this page.
        </div>
      } />

      <Route path='/manager/orders' element={
        <ProtectedRoute roles={['branch_manager']}>
          <OrdersPage />
        </ProtectedRoute>
      } />

      <Route path='/staff/orders' element={
        <ProtectedRoute roles={['staff']}>
          <OrdersPage />
        </ProtectedRoute>
      } />

      <Route path='/manager/payments' element={
        <ProtectedRoute roles={['branch_manager']}>
          <PaymentsPage />
        </ProtectedRoute>
      } />

      <Route path='/staff/payments' element={
        <ProtectedRoute roles={['staff']}>
          <PaymentsPage />
        </ProtectedRoute>
      } />

      <Route path='/manager/inventory' element={
        <ProtectedRoute roles={['branch_manager']}>
          <InventoryPage />
        </ProtectedRoute>
      } />

      <Route path='/staff/inventory' element={
        <ProtectedRoute roles={['staff']}>
          <InventoryPage />
        </ProtectedRoute>
      } />

            <Route path='/manager/customers' element={
        <ProtectedRoute roles={['branch_manager']}>
          <CustomersPage />
        </ProtectedRoute>
      } />

      <Route path='/staff/customers' element={
        <ProtectedRoute roles={['staff']}>
          <CustomersPage />
        </ProtectedRoute>
      } />

      <Route path='/manager/expenses' element={
        <ProtectedRoute roles={['branch_manager']}>
          <ExpensesPage />
        </ProtectedRoute>
      } />

      <Route path='/hq/reports' element={
        <ProtectedRoute roles={['hq_admin']}>
          <ReportsPage />
        </ProtectedRoute>
      } />

      <Route path='/manager/reports' element={
        <ProtectedRoute roles={['branch_manager']}>
          <ReportsPage />
        </ProtectedRoute>
      } />

      <Route path='/hq/branches' element={
        <ProtectedRoute roles={['hq_admin']}>
          <BranchesPage />
        </ProtectedRoute>
      } />

      <Route path='/hq/staff' element={
        <ProtectedRoute roles={['hq_admin']}>
          <StaffPage />
        </ProtectedRoute>
      } />

      <Route path='/hq/audit-logs' element={
        <ProtectedRoute roles={['hq_admin']}>
          <AuditLogsPage />
        </ProtectedRoute>
      } />

      <Route path='/manager/feedback' element={
        <ProtectedRoute roles={['branch_manager']}>
          <FeedbackPage />
        </ProtectedRoute>
      } />

      <Route path='/staff/feedback' element={
        <ProtectedRoute roles={['staff']}>
          <FeedbackPage />
        </ProtectedRoute>
      } />

      <Route path='/hq/feedback' element={
        <ProtectedRoute roles={['hq_admin']}>
          <FeedbackPage />
        </ProtectedRoute>
      } />

      <Route path='/manager/machines' element={
        <ProtectedRoute roles={['branch_manager']}>
          <MachinesPage />
        </ProtectedRoute>
      } />

      <Route path='/staff/machines' element={
        <ProtectedRoute roles={['staff']}>
          <MachinesPage />
        </ProtectedRoute>
      } />

      <Route path='/hq/machines' element={
        <ProtectedRoute roles={['hq_admin']}>
          <MachinesPage />
        </ProtectedRoute>
      } />

      <Route path='/hq/change-password' element={
        <ProtectedRoute roles={['hq_admin']}>
          <ChangePasswordPage />
        </ProtectedRoute>
      } />

      <Route path='/manager/change-password' element={
        <ProtectedRoute roles={['branch_manager']}>
          <ChangePasswordPage />
        </ProtectedRoute>
      } />

      <Route path='/staff/change-password' element={
        <ProtectedRoute roles={['staff']}>
          <ChangePasswordPage />
        </ProtectedRoute>
      } />

      <Route path='/pos' element={
        <ProtectedRoute roles={['staff', 'branch_manager']}>
          <POSPage />
        </ProtectedRoute>
      } />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

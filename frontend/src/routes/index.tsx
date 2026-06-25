import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import RequireAuth from '../auth/RequireAuth';
import RequireRole from '../auth/RequireRole';
import ClientGuard from '../auth/ClientGuard';
import Login from '../screens/Login';
import Dashboard from '../screens/Dashboard';
import { ClientsListScreen } from '../screens/ClientsList';
import ClientDetail from '../screens/ClientDetail';
import Settings from '../screens/tabs/Settings';
import FlowBuilder from '../screens/tabs/FlowBuilder';
import Conversations from '../screens/tabs/Conversations';
import AuditLogScreen from '../screens/AuditLog';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        handle: { crumb: 'Dashboard' },
        element: <ClientGuard><Dashboard /></ClientGuard>,
      },
      {
        path: 'clients',
        handle: { crumb: 'Clients' },
        element: <ClientGuard><ClientsListScreen /></ClientGuard>,
      },
      {
        path: 'clients/:id',
        handle: { crumb: 'Clients' },
        element: <ClientDetail />,
        children: [
          { index: true, element: <Navigate to="flow" replace /> },
          { path: 'settings', element: <Settings /> },
          { path: 'flow', element: <FlowBuilder /> },
          { path: 'conversations', element: <Conversations /> },
        ],
      },
      {
        path: 'audit',
        handle: { crumb: 'Audit log' },
        element: (
          <RequireRole roles={['admin']} fallback={<Navigate to="/dashboard" replace />}>
            <AuditLogScreen />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;

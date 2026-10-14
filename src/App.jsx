import React from 'react';
import MemberApp from './pages/MemberApp.jsx';
import AdminPage from './pages/AdminPage.jsx';

const isSuperAdminPath = () => {
  const normalizedPathname = window.location.pathname.replace(/\/+$/, '') || '/';
  return normalizedPathname === '/superadmin';
};

export default function App() {
  return isSuperAdminPath() ? <AdminPage /> : <MemberApp />;
}

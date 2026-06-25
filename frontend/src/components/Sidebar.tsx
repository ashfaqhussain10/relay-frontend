import { useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTenants } from '../queries/useTenants';
import styles from './Sidebar.module.css';

const DashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const ClientsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const AccountIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const AuditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { data: tenants } = useTenants();
  const showAdminLinks = role === 'admin' || role === 'support';

  const active = tenants?.filter(t => t.is_active).length;
  const total = tenants?.length;
  const countLabel = total != null ? `${active}/${total}` : null;

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? styles.active : ''}`;

  return (
    <aside
      id="sidebar"
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
      aria-label="Navigation"
    >
      <div className={styles.sidebarHead}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>R</div>
          <span className={styles.logoWord}>Relay</span>
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close navigation"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className={styles.nav} aria-label="Main navigation">
        {showAdminLinks && (
          <>
            <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
              <DashIcon /> Dashboard
            </NavLink>
            <NavLink to="/clients" className={linkClass} onClick={onClose}>
              <ClientsIcon /> Clients
              {countLabel && <span className={styles.badge}>{countLabel}</span>}
            </NavLink>
          </>
        )}
        {role === 'admin' && (
          <NavLink to="/audit" className={linkClass} onClick={onClose}>
            <AuditIcon /> Audit log
          </NavLink>
        )}
        {role === 'client' && user?.tenant_id && (
          <NavLink to={`/clients/${user.tenant_id}`} className={linkClass} onClick={onClose}>
            <AccountIcon /> My account
          </NavLink>
        )}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {(user?.email ?? user?.username ?? '?')[0].toUpperCase()}
          </span>
          <span className={styles.email}>{user?.email ?? user?.username}</span>
        </div>
        <button className={styles.logout} onClick={handleLogout} aria-label="Sign out">
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
}

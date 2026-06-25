import { Link, NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import { useTenant } from '../queries/useTenants';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import styles from './ClientDetail.module.css';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const tenantId = Number(id);

  if (!tenantId || isNaN(tenantId)) return <Navigate to="/clients" replace />;

  const { data: tenant, isLoading, error } = useTenant(tenantId);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link to="/clients" className={styles.back} aria-label="Back to clients">
          ← <span>Clients</span>
        </Link>
        <div className={styles.headerMain}>
          {isLoading ? (
            <div className={styles.nameSkel} />
          ) : error ? (
            <span className={styles.nameText} style={{ color: 'var(--danger)' }}>Client not found</span>
          ) : (
            <>
              <div className={styles.headerLeft}>
                <div className={styles.avatar}>{tenant!.name.charAt(0).toUpperCase()}</div>
                <h1 className={styles.nameText}>{tenant!.name}</h1>
              </div>
              <Badge variant={tenant!.is_active ? 'live' : 'inactive'}>
                {tenant!.is_active ? 'Live' : 'Inactive'}
              </Badge>
            </>
          )}
        </div>

        {/* Tabs */}
        <nav className={styles.tabs} aria-label="Client sections">
          <NavLink to="settings" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
            Settings
          </NavLink>
          <NavLink to="flow" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
            Flow builder
          </NavLink>
          <NavLink to="conversations" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}>
            Conversations
          </NavLink>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner fullPage />
      ) : error ? (
        <div className={styles.errorState}>
          <p>Could not load this client. <Link to="/clients">Back to clients</Link></p>
        </div>
      ) : (
        <div className={styles.content}>
          <Outlet />
        </div>
      )}
    </div>
  );
}

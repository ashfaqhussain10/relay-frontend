import { useMatches } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './Topbar.module.css';

interface Match {
  handle?: { crumb?: string };
}

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

interface TopbarProps {
  onMenuOpen: () => void;
  sidebarOpen: boolean;
}

export default function Topbar({ onMenuOpen, sidebarOpen }: TopbarProps) {
  const matches = useMatches() as Match[];
  const { user } = useAuth();

  const crumbs = matches
    .filter(m => m.handle?.crumb)
    .map(m => m.handle!.crumb!);

  const displayName = user?.email ?? user?.username ?? '';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <header className={styles.topbar}>
      <button
        className={styles.menuBtn}
        onClick={onMenuOpen}
        aria-label="Open navigation"
        aria-expanded={sidebarOpen}
        aria-controls="sidebar"
      >
        <MenuIcon />
      </button>

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        {crumbs.length === 0 ? (
          <span className={styles.crumbItem}>Relay</span>
        ) : (
          crumbs.map((c, i) => (
            <span key={i} className={styles.crumbItem}>
              {i > 0 && <span className={styles.sep} aria-hidden="true">›</span>}
              {c}
            </span>
          ))
        )}
      </nav>

      <div className={styles.userChip} aria-label={`Signed in as ${displayName}`}>
        <span className={styles.userAvatar} aria-hidden="true">{initial}</span>
        <span className={styles.userEmail}>{displayName}</span>
      </div>
    </header>
  );
}

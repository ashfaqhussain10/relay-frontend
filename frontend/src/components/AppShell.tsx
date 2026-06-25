import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './AppShell.module.css';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <div className={styles.shell}>
        {sidebarOpen && (
          <div className={styles.backdrop} onClick={closeSidebar} aria-hidden="true" />
        )}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className={styles.main}>
          <Topbar onMenuOpen={openSidebar} sidebarOpen={sidebarOpen} />
          <main className={styles.content} id="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

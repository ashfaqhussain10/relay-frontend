import { useAuditLogs } from '../queries/useAuditLogs';
import EmptyState from '../components/EmptyState';
import SkeletonRow from '../components/SkeletonRow';
import type { AuditLog } from '../types';
import styles from './AuditLog.module.css';

/* ── Helpers ── */

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ACTION_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: 'Create', cls: 'create' },
  1: { label: 'Update', cls: 'update' },
  2: { label: 'Delete', cls: 'delete' },
};

function ActionBadge({ action, verb }: { action?: number; verb?: string }) {
  const meta = action !== undefined ? ACTION_LABELS[action] : undefined;
  const label = meta?.label ?? verb ?? '—';
  const cls = meta?.cls ?? 'update';
  return <span className={`${styles.actionBadge} ${styles[cls]}`}>{label}</span>;
}

function ChangesCell({ changes }: { changes: AuditLog['changes'] }) {
  if (!changes) return <span className={styles.muted}>—</span>;

  if (typeof changes === 'string') {
    try {
      const parsed = JSON.parse(changes);
      return <ChangesCell changes={parsed} />;
    } catch {
      return <span className={styles.changesRaw}>{changes}</span>;
    }
  }

  const entries = Object.entries(changes);
  if (entries.length === 0) return <span className={styles.muted}>—</span>;

  return (
    <ul className={styles.changesList}>
      {entries.slice(0, 4).map(([field, value]) => {
        const [oldVal, newVal] = Array.isArray(value) ? value : [undefined, value];
        return (
          <li key={field}>
            <span className={styles.changeField}>{field}</span>
            {oldVal !== undefined && (
              <>
                <span className={styles.changeOld}>{String(oldVal)}</span>
                <span className={styles.changeArrow}>→</span>
              </>
            )}
            <span className={styles.changeNew}>{String(newVal)}</span>
          </li>
        );
      })}
      {entries.length > 4 && (
        <li className={styles.muted}>+{entries.length - 4} more</li>
      )}
    </ul>
  );
}

/* ── Audit log screen ── */

export default function AuditLogScreen() {
  const { data, isLoading, error } = useAuditLogs();
  const logs = data?.results ?? [];
  const total = data?.count ?? 0;
  const showing = logs.length;
  const hasMore = data?.next !== null && data?.next !== undefined;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1 className={styles.title}>Audit log</h1>
          <p className={styles.subtitle}>Read-only record of all platform actions.</p>
        </div>
        {total > 0 && (
          <span className={styles.meta}>
            Showing {showing} of {total}
            {hasMore && ' — oldest may be truncated'}
          </span>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Object</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} cols={5} />)}

            {error && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    heading="Couldn't load audit log"
                    subtext="Refresh the page to try again."
                  />
                </td>
              </tr>
            )}

            {!isLoading && !error && logs.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    heading="No audit entries yet"
                    subtext="Actions on the platform will appear here."
                  />
                </td>
              </tr>
            )}

            {!isLoading && !error && logs.map(log => (
              <tr key={log.id} className={styles.row}>
                <td className={styles.timeCell}>{fmtTime(log.timestamp)}</td>
                <td className={styles.actorCell}>
                  {log.actor ?? <span className={styles.muted}>System</span>}
                </td>
                <td>
                  <ActionBadge action={log.action} verb={log.verb} />
                </td>
                <td className={styles.objectCell}>
                  {log.content_type && (
                    <span className={styles.contentType}>{log.content_type}</span>
                  )}
                  {log.object_repr && (
                    <span className={styles.objectRepr}>{log.object_repr}</span>
                  )}
                  {!log.content_type && !log.object_repr && (
                    <span className={styles.muted}>—</span>
                  )}
                </td>
                <td><ChangesCell changes={log.changes} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSessions, useMessages } from '../../queries/useSessions';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import type { Session, Message } from '../../types';
import styles from './Conversations.module.css';

/* ── Helpers ── */

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function sessionStatusVariant(status: Session['status']): 'active' | 'completed' | 'handedoff' {
  if (status === 'completed') return 'completed';
  if (status === 'handed_off') return 'handedoff';
  return 'active';
}

function sessionStatusLabel(status: Session['status']) {
  if (status === 'completed') return 'Completed';
  if (status === 'handed_off') return 'Handed off';
  return 'Active';
}

/* ── Message thread (rendered when a session row is expanded) ── */

function isSystemEvent(msg: Message) {
  // Heuristic: outbound with no provider_message_id is a system note
  return msg.direction === 'outbound' && !msg.provider_message_id;
}

function MessageThread({ sessionId }: { sessionId: number }) {
  const { data: messages, isLoading, error } = useMessages(sessionId);

  if (isLoading) return <div className={styles.threadLoading}><Spinner size="sm" /></div>;
  if (error) return <div className={styles.threadErr}>Failed to load messages.</div>;
  if (!messages || messages.length === 0) {
    return <p className={styles.threadEmpty}>No messages recorded for this session.</p>;
  }

  const inbound = messages.filter(m => m.direction === 'inbound');
  const pathTrail = inbound.map(m => m.content).join(' › ');

  return (
    <div className={styles.thread}>
      {pathTrail && (
        <div className={styles.pathTrail}>
          <span className={styles.pathLabel}>Path</span>
          <span className={styles.pathValue}>{pathTrail}</span>
        </div>
      )}

      <div className={styles.bubbles}>
        {messages.map(msg => {
          if (isSystemEvent(msg)) {
            return (
              <div key={msg.id} className={styles.systemRow}>
                <span className={styles.systemPill}>{msg.content}</span>
              </div>
            );
          }
          if (msg.direction === 'outbound') {
            return (
              <div key={msg.id} className={styles.botRow}>
                <div className={styles.botBubble}>{msg.content}</div>
                <span className={styles.msgTime}>{fmtTime(msg.sent_at)}</span>
              </div>
            );
          }
          return (
            <div key={msg.id} className={styles.customerRow}>
              <span className={styles.msgTime}>{fmtTime(msg.sent_at)}</span>
              <div className={styles.customerBubble}>{msg.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Session row ── */

function SessionRow({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);
  const channelVariant = session.channel === 'whatsapp' ? 'whatsapp' : 'instagram';
  const channelLabel = session.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram';

  return (
    <div className={`${styles.sessionCard} ${expanded ? styles.sessionExpanded : ''}`}>
      <button
        className={styles.sessionRow}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <Badge variant={channelVariant}>{channelLabel}</Badge>

        <span className={styles.customerId}>
          {session.customer_identifier}
        </span>

        <span className={styles.timestamp}>{fmtTime(session.started_at)}</span>

        <Badge variant={sessionStatusVariant(session.status)}>
          {sessionStatusLabel(session.status)}
        </Badge>

        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>
          ›
        </span>
      </button>

      {expanded && (
        <div className={styles.threadWrap}>
          <MessageThread sessionId={session.id} />
        </div>
      )}
    </div>
  );
}

/* ── Conversations tab ── */

export default function Conversations() {
  const { id } = useParams<{ id: string }>();
  const tenantId = Number(id);
  const { data: sessions, isLoading, error } = useSessions(tenantId);

  // Newest first
  const sorted = sessions ? [...sessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  ) : [];

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Conversations</h2>
        {sessions && (
          <span className={styles.count}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {isLoading && (
        <div className={styles.loadingRows}>
          {[1, 2, 3].map(i => <div key={i} className={styles.skelRow} />)}
        </div>
      )}

      {error && (
        <EmptyState
          heading="Couldn't load conversations"
          subtext="Refresh the page to try again."
        />
      )}

      {!isLoading && !error && sorted.length === 0 && (
        <EmptyState
          heading="No conversations logged yet"
          subtext="Run the flow to see logs here."
        />
      )}

      {!isLoading && !error && sorted.length > 0 && (
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <span>Channel</span>
            <span>Customer</span>
            <span>Started</span>
            <span>Status</span>
            <span />
          </div>
          {sorted.map(session => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

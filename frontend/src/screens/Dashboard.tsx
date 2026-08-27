import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenants } from '../queries/useTenants';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import Button from '../components/Button';
import RequireRole from '../auth/RequireRole';
import CreateClientModal from './ClientsList';
import styles from './Dashboard.module.css';

function ClientCard({ tenant, onClick }: { tenant: import('../types').Tenant; onClick: () => void }) {
  const initial = tenant.name.charAt(0).toUpperCase();
  return (
    <button className={styles.clientCard} onClick={onClick}>
      <div className={styles.cardAvatar}>{initial}</div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{tenant.name}</div>
        <div className={styles.cardMeta}>
          {tenant.wa_phone_number
            ? <span className={styles.mono}>{tenant.wa_phone_number}</span>
            : tenant.wa_phone_number_id
              ? <span className={styles.muted}>WhatsApp connected</span>
              : <span className={styles.muted}>No WhatsApp</span>}
          {tenant.ig_account_id && <span className={styles.muted}> · {tenant.ig_account_id}</span>}
        </div>
      </div>
      <div className={styles.cardBadges}>
        <Badge variant={tenant.is_active ? 'live' : 'inactive'}>
          {tenant.is_active ? 'Live' : 'Off'}
        </Badge>
        {tenant.handoff_enabled && <Badge variant="handoff">Handoff</Badge>}
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: tenants, isLoading, error } = useTenants();
  const [showCreate, setShowCreate] = useState(false);

  const total = tenants?.length ?? 0;
  const active = tenants?.filter(t => t.is_active).length ?? 0;
  // A tenant is connected to WhatsApp when it has a phone_number_id (that's what
  // routes inbound messages). wa_phone_number is only the human-readable number
  // and is often blank, so counting it under-reports live channels.
  const waCount = tenants?.filter(t => t.wa_phone_number_id || t.wa_phone_number).length ?? 0;
  const igCount = tenants?.filter(t => t.ig_account_id).length ?? 0;
  const handoffCount = tenants?.filter(t => t.handoff_enabled).length ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Manage your clients' WhatsApp and Instagram chatbot flows.</p>
        </div>
        <RequireRole roles={['admin']}>
          <Button onClick={() => setShowCreate(true)}>+ New client</Button>
        </RequireRole>
      </div>

      {/* How it works */}
      <div className={styles.howItWorks}>
        {[
          { n: 1, label: 'Configure flow', desc: 'Build the message steps and reply buttons for your client.' },
          { n: 2, label: 'Customer chats', desc: 'Customers message on WhatsApp or Instagram and the bot responds.' },
          { n: 3, label: 'End or hand off', desc: 'Flow concludes or escalates to a human via email handoff.' },
        ].map(step => (
          <div key={step.n} className={styles.step}>
            <div className={styles.stepNum}>{step.n}</div>
            <div>
              <div className={styles.stepLabel}>{step.label}</div>
              <div className={styles.stepDesc}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <StatCard
          label="Clients"
          value={total}
          sub={`${active} active`}
        />
        <StatCard
          label="WhatsApp"
          value={waCount}
          sub="channels connected"
        />
        <StatCard
          label="Instagram"
          value={igCount}
          sub="channels connected"
        />
        <StatCard
          label="Handoff"
          value={handoffCount}
          sub="enabled"
        />
      </div>

      {/* Clients grid */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your clients</h2>

        {isLoading && (
          <div className={styles.grid}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.clientCardSkel} />
            ))}
          </div>
        )}

        {error && (
          <EmptyState
            heading="Couldn't load clients"
            subtext="Check your connection and refresh the page."
          />
        )}

        {!isLoading && !error && total === 0 && (
          <EmptyState
            heading="No clients yet"
            subtext="Create your first client to get started."
            action={
              <RequireRole roles={['admin']}>
                <Button onClick={() => setShowCreate(true)}>Create first client</Button>
              </RequireRole>
            }
          />
        )}

        {!isLoading && !error && total > 0 && (
          <div className={styles.grid}>
            {tenants!.map(tenant => (
              <ClientCard
                key={tenant.id}
                tenant={tenant}
                onClick={() => navigate(`/clients/${tenant.id}/flow`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateClientModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

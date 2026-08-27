import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenants, useCreateTenant } from '../queries/useTenants';
import { useCreateFlowStep, useCreateFlowOption } from '../queries/useFlowSteps';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../auth/AuthContext';
import RequireRole from '../auth/RequireRole';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SkeletonRow from '../components/SkeletonRow';
import styles from './ClientsList.module.css';
import type { Tenant } from '../types';

/* ── Create client modal ─────────────────────────────── */

const createSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  wa_phone_number: z.string().optional().or(z.literal('')),
  ig_account_id: z.string().optional().or(z.literal('')),
  handoff_email: z.string().email('Enter a valid email address').or(z.literal('')).optional(),
});
type CreateFields = z.infer<typeof createSchema>;

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateClientModal({ open, onClose }: CreateClientModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createTenant = useCreateTenant();
  const createFlowStep = useCreateFlowStep();
  const createFlowOption = useCreateFlowOption();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateFields>({ resolver: zodResolver(createSchema) });

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (data: CreateFields) => {
    try {
      const greeting = `Hi! Welcome to ${data.name}. How can we help you today?`;
      const closing = `Thank you for contacting ${data.name}. Have a great day!`;

      const tenant = await createTenant.mutateAsync({
        name: data.name,
        wa_phone_number: data.wa_phone_number || undefined,
        ig_account_id: data.ig_account_id || undefined,
        handoff_email: data.handoff_email || undefined,
        handoff_enabled: !!(data.handoff_email),
        greeting_message: greeting,
        closing_message: closing,
        is_active: false,
      } as Partial<Tenant>);

      // Inject starter flow — best-effort, don't block on failure
      try {
        const step = await createFlowStep.mutateAsync({
          tenant: tenant.id,
          label: 'Welcome',
          message_text: greeting,
          is_start: true,
          is_terminal: false,
        });
        await Promise.all([
          createFlowOption.mutateAsync({ tenantId: tenant.id, step: step.id, button_label: 'Option 1', next_step: null }),
          createFlowOption.mutateAsync({ tenantId: tenant.id, step: step.id, button_label: 'Option 2', next_step: null }),
        ]);
      } catch {
        // starter flow failed silently — user can build it in Phase 4
      }

      toast('Client created');
      reset();
      onClose();
      navigate(`/clients/${tenant.id}/flow`);
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Failed to create client' });
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="New client">
      <form id="create-client-form" onSubmit={handleSubmit(onSubmit)}>
        {errors.root && (
          <div className={styles.formError} role="alert">{errors.root.message}</div>
        )}

        <div className={styles.field}>
          <label htmlFor="cc-name">Business name <span className={styles.req}>*</span></label>
          <input id="cc-name" type="text" autoFocus {...register('name')} aria-invalid={!!errors.name} />
          {errors.name && <span className={styles.fieldErr}>{errors.name.message}</span>}
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="cc-wa">WhatsApp number</label>
            <input id="cc-wa" type="tel" placeholder="+1234567890" {...register('wa_phone_number')} />
          </div>
          <div className={styles.field}>
            <label htmlFor="cc-ig">Instagram handle</label>
            <input id="cc-ig" type="text" placeholder="@handle" {...register('ig_account_id')} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="cc-email">Handoff email</label>
          <input id="cc-email" type="email" placeholder="support@example.com" {...register('handoff_email')} aria-invalid={!!errors.handoff_email} />
          {errors.handoff_email && <span className={styles.fieldErr}>{errors.handoff_email.message}</span>}
          <span className={styles.hint}>When provided, handoff is enabled automatically.</span>
        </div>
      </form>

      <div className={styles.modalFooter}>
        <Button variant="secondary" onClick={handleClose} type="button">Cancel</Button>
        <Button
          type="submit"
          form="create-client-form"
          loading={isSubmitting}
        >
          Create client
        </Button>
      </div>
    </Modal>
  );
}

/* ── Clients list screen ─────────────────────────────── */

function StatusCell({ tenant }: { tenant: Tenant }) {
  return <Badge variant={tenant.is_active ? 'live' : 'inactive'}>{tenant.is_active ? 'Live' : 'Inactive'}</Badge>;
}

export function ClientsListScreen() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data: tenants, isLoading, error } = useTenants();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Clients</h1>
        <RequireRole roles={['admin']}>
          <Button onClick={() => setShowCreate(true)}>+ New client</Button>
        </RequireRole>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Business</th>
              <th>WhatsApp</th>
              <th>Instagram</th>
              <th>Handoff</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {isLoading && [1, 2, 3, 4].map(i => <SkeletonRow key={i} cols={6} />)}

            {error && (
              <tr>
                <td colSpan={6}>
                  <EmptyState heading="Couldn't load clients" subtext="Refresh the page to try again." />
                </td>
              </tr>
            )}

            {!isLoading && !error && tenants?.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    heading="No clients yet"
                    subtext="Create your first client to get started."
                    action={
                      role === 'admin'
                        ? <Button onClick={() => setShowCreate(true)}>Create first client</Button>
                        : undefined
                    }
                  />
                </td>
              </tr>
            )}

            {!isLoading && !error && tenants?.map(tenant => (
              <tr
                key={tenant.id}
                className={styles.row}
                onClick={() => navigate(`/clients/${tenant.id}/flow`)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/clients/${tenant.id}/flow`)}
              >
                <td>
                  <div className={styles.business}>
                    <div className={styles.avatar}>{tenant.name.charAt(0).toUpperCase()}</div>
                    <span className={styles.businessName}>{tenant.name}</span>
                  </div>
                </td>
                <td className={styles.mono}>{tenant.wa_phone_number
                  || (tenant.wa_phone_number_id
                      ? <span className={styles.muted}>connected</span>
                      : <span className={styles.muted}>—</span>)}</td>
                <td>{tenant.ig_account_id || <span className={styles.muted}>—</span>}</td>
                <td>
                  {tenant.handoff_enabled && tenant.handoff_email
                    ? <span className={styles.handoffEmail}>{tenant.handoff_email}</span>
                    : tenant.handoff_enabled
                      ? <Badge variant="handoff">On</Badge>
                      : <span className={styles.muted}>Off</span>}
                </td>
                <td><StatusCell tenant={tenant} /></td>
                <td className={styles.chevron}>›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateClientModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

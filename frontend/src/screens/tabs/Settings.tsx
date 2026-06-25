import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useTenant,
  usePatchTenant,
  useActivateTenant,
  useDeactivateTenant,
  useSetTokens,
  useDeleteTenant,
} from '../../queries/useTenants';
import { useToast } from '../../components/ToastContext';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import type { ValidationResult } from '../../types';
import styles from './Settings.module.css';

/* ── Shared form field ── */
function Field({
  label, hint, error, children,
}: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.fieldErr}>{error}</span>}
    </div>
  );
}

/* ── Messages section ── */
const msgSchema = z.object({
  greeting_message: z.string().min(1, 'Greeting message is required'),
  closing_message: z.string().min(1, 'Closing message is required'),
});
type MsgFields = z.infer<typeof msgSchema>;

function MessagesSection({ tenantId, handoffEnabled }: { tenantId: number; handoffEnabled: boolean }) {
  const { data: tenant } = useTenant(tenantId);
  const patch = usePatchTenant();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<MsgFields>({
    resolver: zodResolver(msgSchema),
    defaultValues: { greeting_message: '', closing_message: '' },
  });

  useEffect(() => {
    if (tenant) reset({ greeting_message: tenant.greeting_message, closing_message: tenant.closing_message });
  }, [tenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = handleSubmit(async (data) => {
    try {
      await patch.mutateAsync({ id: tenantId, ...data });
      toast('Messages saved');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    }
  });

  return (
    <Card>
      <h3 className={styles.sectionTitle}>Messages</h3>
      <form onSubmit={onSubmit}>
        <Field label="Greeting message" error={errors.greeting_message?.message}
          hint="Sent to the customer before the flow options appear.">
          <textarea className={styles.textarea} rows={3} {...register('greeting_message')}
            aria-invalid={!!errors.greeting_message} />
        </Field>
        <Field
          label="Closing message"
          error={errors.closing_message?.message}
          hint={handoffEnabled ? 'Only sent when handoff is off.' : 'Sent when the flow ends.'}
        >
          <textarea className={styles.textarea} rows={3} {...register('closing_message')}
            aria-invalid={!!errors.closing_message} />
          {handoffEnabled && (
            <p className={styles.infoNote}>Only sent when handoff is off — when handoff is on, the handoff email is sent instead.</p>
          )}
        </Field>
        <div className={styles.actions}>
          <Button type="submit" loading={patch.isPending} disabled={!isDirty}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Handoff section ── */
const handoffSchema = z.object({
  handoff_enabled: z.boolean(),
  handoff_email: z.string().email('Enter a valid email address').or(z.literal('')),
});
type HandoffFields = z.infer<typeof handoffSchema>;

function HandoffSection({ tenantId }: { tenantId: number }) {
  const { data: tenant } = useTenant(tenantId);
  const patch = usePatchTenant();
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<HandoffFields>({
    resolver: zodResolver(handoffSchema),
    defaultValues: { handoff_enabled: false, handoff_email: '' },
  });

  useEffect(() => {
    if (tenant) reset({ handoff_enabled: tenant.handoff_enabled, handoff_email: tenant.handoff_email ?? '' });
  }, [tenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const enabled = watch('handoff_enabled');
  const email = watch('handoff_email');

  const onSubmit = handleSubmit(async (data) => {
    try {
      await patch.mutateAsync({ id: tenantId, ...data });
      toast('Handoff settings saved');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    }
  });

  return (
    <Card>
      <h3 className={styles.sectionTitle}>Human handoff</h3>
      <form onSubmit={onSubmit}>
        <div className={styles.toggleRow}>
          <label className={styles.toggleLabel} htmlFor="handoff-toggle">
            <div className={styles.toggleText}>
              <span>Offer "Talk to a human" at flow end</span>
              <span className={styles.toggleSub}>Adds a handoff option when the flow completes.</span>
            </div>
            <div className={styles.toggle}>
              <input id="handoff-toggle" type="checkbox" className={styles.toggleInput} {...register('handoff_enabled')} />
              <div className={styles.toggleTrack} />
            </div>
          </label>
        </div>

        {enabled && (
          <Field
            label="Handoff email"
            error={errors.handoff_email?.message}
            hint="Relay sends a notification here when a customer asks for a human."
          >
            <input
              type="email"
              className={styles.input}
              placeholder="support@yourcompany.com"
              aria-invalid={!!errors.handoff_email}
              {...register('handoff_email')}
            />
            {enabled && !email && !errors.handoff_email && (
              <p className={styles.warnNote}>Add a handoff email to enable this feature fully.</p>
            )}
          </Field>
        )}

        <div className={styles.actions}>
          <Button type="submit" loading={patch.isPending} disabled={!isDirty}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Channels & identity section ── */
const identitySchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  wa_phone_number: z.string().optional().or(z.literal('')),
  ig_account_id: z.string().optional().or(z.literal('')),
});
type IdentityFields = z.infer<typeof identitySchema>;

function IdentitySection({ tenantId }: { tenantId: number }) {
  const { data: tenant } = useTenant(tenantId);
  const patch = usePatchTenant();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<IdentityFields>({
    resolver: zodResolver(identitySchema),
    defaultValues: { name: '', wa_phone_number: '', ig_account_id: '' },
  });

  useEffect(() => {
    if (tenant) reset({ name: tenant.name, wa_phone_number: tenant.wa_phone_number ?? '', ig_account_id: tenant.ig_account_id ?? '' });
  }, [tenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = handleSubmit(async (data) => {
    try {
      await patch.mutateAsync({ id: tenantId, ...data });
      toast('Identity saved');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    }
  });

  return (
    <Card>
      <h3 className={styles.sectionTitle}>Channels &amp; identity</h3>
      <form onSubmit={onSubmit}>
        <Field label="Business name" error={errors.name?.message}>
          <input className={styles.input} type="text" aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <div className={styles.row2}>
          <Field label="WhatsApp number">
            <input className={`${styles.input} ${styles.mono}`} type="tel" placeholder="+1234567890" {...register('wa_phone_number')} />
          </Field>
          <Field label="Instagram handle">
            <input className={styles.input} type="text" placeholder="@handle" {...register('ig_account_id')} />
          </Field>
        </div>
        <div className={styles.actions}>
          <Button type="submit" loading={patch.isPending} disabled={!isDirty}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Channel tokens section ── */
const tokensSchema = z.object({
  wa_access_token: z.string().optional().or(z.literal('')),
  ig_access_token: z.string().optional().or(z.literal('')),
});
type TokenFields = z.infer<typeof tokensSchema>;

function TokensSection({ tenantId }: { tenantId: number }) {
  const setTokens = useSetTokens();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<TokenFields>({
    resolver: zodResolver(tokensSchema),
    defaultValues: { wa_access_token: '', ig_access_token: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    const payload: { wa_access_token?: string; ig_access_token?: string } = {};
    if (data.wa_access_token) payload.wa_access_token = data.wa_access_token;
    if (data.ig_access_token) payload.ig_access_token = data.ig_access_token;
    try {
      await setTokens.mutateAsync({ id: tenantId, ...payload });
      toast('Tokens saved');
      reset();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save tokens', 'error');
    }
  });

  return (
    <Card>
      <h3 className={styles.sectionTitle}>Channel access tokens</h3>
      <p className={styles.sectionSub}>Tokens are write-only and never displayed after saving.</p>
      <form onSubmit={onSubmit}>
        <div className={styles.row2}>
          <Field label="WhatsApp access token">
            <input className={styles.input} type="password" autoComplete="off"
              placeholder="Enter new token to update" {...register('wa_access_token')} />
          </Field>
          <Field label="Instagram access token">
            <input className={styles.input} type="password" autoComplete="off"
              placeholder="Enter new token to update" {...register('ig_access_token')} />
          </Field>
        </div>
        <div className={styles.actions}>
          <Button type="submit" loading={setTokens.isPending} disabled={!isDirty}>Save tokens</Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Bot controls section (visible to all; activate/deactivate gated to admin) ── */
function BotControlsSection({ tenantId }: { tenantId: number }) {
  const { data: tenant } = useTenant(tenantId);
  const activate = useActivateTenant();
  const deactivate = useDeactivateTenant();
  const { toast } = useToast();
  const { role } = useAuth();
  const [activateErrors, setActivateErrors] = useState<Array<{ code: string; message: string }>>([]);

  const isAdmin = role === 'admin';

  const handleActivate = async () => {
    if (!isAdmin) {
      toast("Activating the bot isn't available for your role");
      return;
    }
    setActivateErrors([]);
    try {
      await activate.mutateAsync(tenantId);
      toast('Bot activated');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        setActivateErrors((err as ValidationResult).errors);
      } else {
        toast('Activation failed. Fix flow errors first.', 'error');
      }
    }
  };

  const handleDeactivate = async () => {
    if (!isAdmin) {
      toast("Deactivating the bot isn't available for your role");
      return;
    }
    try {
      await deactivate.mutateAsync(tenantId);
      toast('Bot deactivated');
    } catch {
      toast('Deactivation failed', 'error');
    }
  };

  return (
    <Card>
      <div className={styles.botControls}>
        <div className={styles.botStatus}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Bot status</h3>
          {tenant && (
            <Badge variant={tenant.is_active ? 'live' : 'inactive'}>
              {tenant.is_active ? 'Live' : 'Inactive'}
            </Badge>
          )}
        </div>

        {activateErrors.length > 0 && (
          <div className={styles.activateErrors} role="alert">
            <strong>Cannot activate — fix these flow issues:</strong>
            <ul>
              {activateErrors.map(e => <li key={e.code}>{e.message}</li>)}
            </ul>
          </div>
        )}

        <div className={styles.botActions}>
          {tenant?.is_active ? (
            <Button
              variant="secondary"
              onClick={handleDeactivate}
              loading={isAdmin && deactivate.isPending}
              aria-disabled={!isAdmin}
              className={!isAdmin ? styles.btnRoleLocked : ''}
            >
              Deactivate bot
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              loading={isAdmin && activate.isPending}
              aria-disabled={!isAdmin}
              className={!isAdmin ? styles.btnRoleLocked : ''}
            >
              Activate bot
            </Button>
          )}
          {!isAdmin && (
            <span className={styles.roleNote}>Activation requires a platform admin.</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ── Danger zone (Admin only) ── */
function DangerZoneSection({ tenantId }: { tenantId: number }) {
  const { data: tenant } = useTenant(tenantId);
  const deleteTenant = useDeleteTenant();
  const { toast } = useToast();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  if (role !== 'admin') return null;

  const handleDelete = async () => {
    try {
      await deleteTenant.mutateAsync(tenantId);
      toast('Client deleted');
      navigate('/clients');
    } catch {
      toast('Failed to delete client. Try again.', 'error');
    }
  };

  return (
    <Card>
      <div className={styles.dangerZone}>
        <div>
          <h3 className={styles.sectionTitle} style={{ color: 'var(--danger)', marginBottom: 4 }}>
            Danger zone
          </h3>
          <p className={styles.sectionSub} style={{ marginBottom: 0 }}>
            Permanently delete this client and all associated flows, sessions, and messages.
          </p>
        </div>

        {!confirming ? (
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
            Delete client
          </Button>
        ) : (
          <div className={styles.deleteConfirm}>
            <p className={styles.deleteWarn}>
              Delete <strong>{tenant?.name ?? 'this client'}</strong>? This cannot be undone.
            </p>
            <div className={styles.deleteActions}>
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteTenant.isPending}
                onClick={handleDelete}
              >
                Confirm delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Settings tab root ── */
export default function Settings() {
  const { id } = useParams<{ id: string }>();
  const tenantId = Number(id);
  // Each section fetches useTenant independently; initialData from list cache
  // means loading is instant in the common case — no top-level spinner needed.
  const { data: tenant } = useTenant(tenantId);

  return (
    <div className={styles.page}>
      <BotControlsSection tenantId={tenantId} />
      <MessagesSection tenantId={tenantId} handoffEnabled={tenant?.handoff_enabled ?? false} />
      <HandoffSection tenantId={tenantId} />
      <IdentitySection tenantId={tenantId} />
      <TokensSection tenantId={tenantId} />
      <DangerZoneSection tenantId={tenantId} />
    </div>
  );
}

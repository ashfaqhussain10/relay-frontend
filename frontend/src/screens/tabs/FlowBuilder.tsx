import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useFlowSteps, useCreateFlowStep } from '../../queries/useFlowSteps';
import { useTenant, useActivateTenant, useDeactivateTenant } from '../../queries/useTenants';
import { validateFlow } from '../../lib/validateFlow';
import StepCard from '../../components/StepCard';
import PhonePreview from '../../components/PhonePreview';
import { useAuth } from '../../auth/AuthContext';
import Spinner from '../../components/Spinner';
import type { ValidationIssue } from '../../lib/validateFlow';
import { useToast } from '../../components/ToastContext';
import styles from './FlowBuilder.module.css';

/* ── Validation banner ── */

interface BannerProps {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  activateErrors: ValidationIssue[];
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  isActivating: boolean;
  isDeactivating: boolean;
}

function ValidationBanner({
  valid, errors, warnings, activateErrors,
  isActive, onActivate, onDeactivate,
  isActivating, isDeactivating,
}: BannerProps) {
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === 'admin';
  const allErrors = [...errors, ...activateErrors];
  const hasIssues = allErrors.length > 0;

  const handleActivateClick = () => {
    if (!isAdmin) { toast("Activating the flow isn't available for your role"); return; }
    onActivate();
  };
  const handleDeactivateClick = () => {
    if (!isAdmin) { toast("Deactivating the flow isn't available for your role"); return; }
    onDeactivate();
  };

  return (
    <div className={`${styles.banner} ${hasIssues ? styles.bannerError : valid ? styles.bannerValid : styles.bannerNeutral}`}>
      <div className={styles.bannerLeft}>
        <span className={styles.bannerIcon}>{hasIssues ? '⚠' : valid ? '✓' : '○'}</span>
        <div className={styles.bannerText}>
          {hasIssues ? (
            <>
              <strong>{allErrors.length} issue{allErrors.length !== 1 ? 's' : ''} — fix before activating</strong>
              <ul className={styles.issueList}>
                {allErrors.map((e, i) => <li key={`${e.code}-${i}`}>{e.message}</li>)}
              </ul>
            </>
          ) : valid ? (
            <strong>Flow valid — ready to activate</strong>
          ) : (
            <span>Add steps to build your flow.</span>
          )}
          {warnings.length > 0 && (
            <ul className={styles.warnList}>
              {warnings.map((w, i) => <li key={`${w.code}-${i}`}>⚠ {w.message}</li>)}
            </ul>
          )}
        </div>
      </div>

      <div className={styles.bannerActions}>
        {isActive ? (
          <button
            className={`${styles.deactivateBtn} ${!isAdmin ? styles.roleLocked : ''}`}
            onClick={handleDeactivateClick}
            disabled={isAdmin && isDeactivating}
            aria-disabled={!isAdmin}
          >
            {isAdmin && isDeactivating ? 'Deactivating…' : 'Deactivate flow'}
          </button>
        ) : (
          <button
            className={`${styles.activateBtn} ${!isAdmin ? styles.roleLocked : ''}`}
            onClick={handleActivateClick}
            disabled={isAdmin && (!valid || isActivating)}
            aria-disabled={!isAdmin}
            title={isAdmin && !valid ? 'Fix flow issues before activating' : undefined}
          >
            {isAdmin && isActivating ? 'Activating…' : 'Activate flow'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── FlowBuilder screen ── */

export default function FlowBuilder() {
  const { id } = useParams<{ id: string }>();
  const tenantId = Number(id);

  const { data: steps = [], isLoading, error } = useFlowSteps(tenantId);
  const { data: tenant } = useTenant(tenantId);
  const createStep = useCreateFlowStep();
  const activate = useActivateTenant();
  const deactivate = useDeactivateTenant();
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activateErrors, setActivateErrors] = useState<ValidationIssue[]>([]);

  const validation = useMemo(() => validateFlow(steps), [steps]);

  const handleAddStep = async () => {
    const isFirst = steps.length === 0;
    try {
      const step = await createStep.mutateAsync({
        tenant: tenantId,
        label: 'New step',
        message_text: '',
        is_start: isFirst,
        is_terminal: false,
      });
      setExpandedId(step.id);
    } catch {
      toast('Failed to create step', 'error');
    }
  };

  const handleActivate = async () => {
    setActivateErrors([]);
    try {
      await activate.mutateAsync(tenantId);
      toast('Flow activated');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        setActivateErrors((err as { errors: ValidationIssue[] }).errors);
      } else {
        toast('Activation failed', 'error');
      }
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivate.mutateAsync(tenantId);
      toast('Flow deactivated');
    } catch {
      toast('Deactivation failed', 'error');
    }
  };

  return (
    <div className={styles.layout}>
      {/* Left: steps */}
      <div className={styles.stepsCol}>
        <ValidationBanner
          valid={validation.valid}
          errors={validation.errors}
          warnings={validation.warnings}
          activateErrors={activateErrors}
          isActive={tenant?.is_active ?? false}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          isActivating={activate.isPending}
          isDeactivating={deactivate.isPending}
        />

        {isLoading && <Spinner fullPage />}

        {error && (
          <div className={styles.loadError}>
            Failed to load flow steps. Refresh to try again.
          </div>
        )}

        {!isLoading && !error && (
          <>
            {steps.length === 0 && (
              <div className={styles.emptySteps}>
                <div className={styles.emptyIcon}>⚙️</div>
                <p>No steps yet. Add your first step to start building the flow.</p>
              </div>
            )}

            <div className={styles.stepsList}>
              {steps.map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  steps={steps}
                  tenantId={tenantId}
                  isExpanded={expandedId === step.id}
                  onExpand={() => setExpandedId(step.id)}
                  onCollapse={() => setExpandedId(null)}
                />
              ))}
            </div>

            <button
              className={styles.addStepBtn}
              onClick={handleAddStep}
              disabled={createStep.isPending}
            >
              {createStep.isPending ? 'Adding step…' : '+ Add step'}
            </button>
          </>
        )}
      </div>

      {/* Right: phone preview */}
      <div className={styles.previewCol}>
        <PhonePreview steps={steps} />
      </div>
    </div>
  );
}

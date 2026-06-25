import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import {
  usePatchFlowStep,
  useDeleteFlowStep,
  useCreateFlowOption,
  usePatchFlowOption,
  useDeleteFlowOption,
} from '../queries/useFlowSteps';
import type { FlowStep, FlowOption } from '../types';
import styles from './StepCard.module.css';

/* ── Option row ──────────────────────────────────────── */

interface OptionRowProps {
  opt: FlowOption;
  steps: FlowStep[];
  currentStepId: number;
  tenantId: number;
}

function OptionRow({ opt, steps, currentStepId, tenantId }: OptionRowProps) {
  const [label, setLabel] = useState(opt.button_label);
  const patchOpt = usePatchFlowOption();
  const deleteOpt = useDeleteFlowOption();

  // Sync label if server value changes (e.g., after option is newly created)
  const optIdRef = useRef(opt.id);
  useEffect(() => {
    if (opt.id !== optIdRef.current) {
      setLabel(opt.button_label);
      optIdRef.current = opt.id;
    }
  }, [opt.id, opt.button_label]);

  const handleLabelChange = (v: string) => setLabel(v.slice(0, 20));

  const handleLabelBlur = () => {
    if (label !== opt.button_label) {
      patchOpt.mutate({ id: opt.id, tenantId, button_label: label });
    }
  };

  const handleTargetChange = (val: string) => {
    patchOpt.mutate({ id: opt.id, tenantId, next_step: val === '' ? null : Number(val) });
  };

  const atLimit = label.length >= 20;

  return (
    <div className={styles.optionRow}>
      <div className={styles.labelWrap}>
        <input
          className={styles.labelInput}
          value={label}
          onChange={e => handleLabelChange(e.target.value)}
          onBlur={handleLabelBlur}
          maxLength={20}
          aria-label="Button label"
          placeholder="Button label"
        />
        <span className={`${styles.charCount} ${atLimit ? styles.charFull : ''}`}>
          {label.length}/20
        </span>
      </div>

      <span className={styles.arrow} aria-hidden>›</span>

      <select
        className={styles.targetSelect}
        value={opt.next_step ?? ''}
        onChange={e => handleTargetChange(e.target.value)}
        aria-label="Target step"
      >
        <option value="">⏹ End flow</option>
        {steps
          .filter(s => s.id !== currentStepId)
          .map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
      </select>

      <button
        className={styles.deleteOptBtn}
        onClick={() => deleteOpt.mutate({ id: opt.id, tenantId })}
        aria-label={`Delete option "${opt.button_label}"`}
        title="Delete option"
      >
        ×
      </button>
    </div>
  );
}

/* ── StepCard ────────────────────────────────────────── */

interface StepCardProps {
  step: FlowStep;
  steps: FlowStep[];
  tenantId: number;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export default function StepCard({
  step,
  steps,
  tenantId,
  isExpanded,
  onExpand,
  onCollapse,
}: StepCardProps) {
  const [label, setLabel] = useState(step.label);
  const [messageText, setMessageText] = useState(step.message_text);

  const patchStep = usePatchFlowStep();
  const deleteStep = useDeleteFlowStep();
  const createOpt = useCreateFlowOption();

  // Sync local state only when switching to a different step
  const stepIdRef = useRef(step.id);
  useEffect(() => {
    if (step.id !== stepIdRef.current) {
      setLabel(step.label);
      setMessageText(step.message_text);
      stepIdRef.current = step.id;
    }
  }, [step.id, step.label, step.message_text]);

  const handleLabelBlur = () => {
    if (label.trim() === '') { setLabel(step.label); return; }
    if (label !== step.label) patchStep.mutate({ id: step.id, label });
  };

  const handleMessageBlur = () => {
    if (messageText !== step.message_text) patchStep.mutate({ id: step.id, message_text: messageText });
  };

  const handleStartToggle = async (checked: boolean) => {
    if (checked) {
      const current = steps.find(s => s.is_start && s.id !== step.id);
      if (current) await patchStep.mutateAsync({ id: current.id, is_start: false });
      patchStep.mutate({ id: step.id, is_start: true });
    } else {
      patchStep.mutate({ id: step.id, is_start: false });
    }
  };

  const handleAddOption = () => {
    createOpt.mutate({ tenantId, step: step.id, button_label: 'New option', next_step: null });
  };

  const handleDeleteStep = async () => {
    // Cascade: reset any options in other steps that pointed to this one
    const cascades: Promise<Response>[] = [];
    for (const other of steps) {
      if (other.id === step.id) continue;
      for (const opt of other.options) {
        if (opt.next_step === step.id) {
          cascades.push(
            apiFetch(`/api/flow-options/${opt.id}/`, {
              method: 'PATCH',
              body: JSON.stringify({ next_step: null }),
            })
          );
        }
      }
    }
    await Promise.all(cascades);
    deleteStep.mutate({ id: step.id, tenantId });
    onCollapse();
  };

  const msgLen = messageText.length;
  const showCounter = msgLen > 800;
  const tooLong = msgLen > 1024;

  /* ── Collapsed view ── */
  if (!isExpanded) {
    return (
      <div
        className={styles.card}
        onClick={onExpand}
        onKeyDown={e => e.key === 'Enter' && onExpand()}
        tabIndex={0}
        role="button"
        aria-label={`Expand step: ${step.label}`}
      >
        <div className={styles.collapsedHeader}>
          <div className={styles.collapsedLeft}>
            <span className={styles.stepId}>#{step.id}</span>
            <span className={styles.stepLabelText}>{step.label}</span>
            {step.is_start && <span className={styles.startBadge}>START</span>}
            {step.is_terminal && <span className={styles.endBadge}>END</span>}
          </div>
          <span className={styles.optCount}>{step.options.length} opt{step.options.length !== 1 ? 's' : ''}</span>
        </div>

        {step.options.length > 0 && (
          <div className={styles.optMap}>
            {step.options.map(opt => {
              const target = opt.next_step
                ? steps.find(s => s.id === opt.next_step)?.label ?? '(missing step)'
                : null;
              return (
                <div key={opt.id} className={styles.optMapRow}>
                  <span className={styles.optMapLabel}>{opt.button_label}</span>
                  <span className={styles.optMapArrow}>›</span>
                  {target
                    ? <span className={styles.optMapTarget}>{target}</span>
                    : <span className={styles.optMapEnd}>End flow</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── Expanded view ── */
  return (
    <div className={`${styles.card} ${styles.expanded}`}>
      <div className={styles.expandedHeader}>
        <div className={styles.expandedTitle}>
          <span className={styles.stepId}>#{step.id}</span>
          {step.is_start && <span className={styles.startBadge}>START</span>}
          {step.is_terminal && <span className={styles.endBadge}>END</span>}
        </div>
        <button className={styles.collapseBtn} onClick={onCollapse} aria-label="Collapse">↑</button>
      </div>

      {/* Step name */}
      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel}>Step name</label>
        <input
          className={styles.input}
          value={label}
          autoFocus
          onChange={e => setLabel(e.target.value)}
          onBlur={handleLabelBlur}
          placeholder="e.g. Welcome"
        />
      </div>

      {/* Message text */}
      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel}>
          Message text
          {showCounter && (
            <span className={`${styles.msgCounter} ${tooLong ? styles.msgTooLong : ''}`}>
              {msgLen}{tooLong ? ' — too long (max 1024 for WhatsApp)' : ' — keep under 1024 for WhatsApp'}
            </span>
          )}
        </label>
        <textarea
          className={styles.textarea}
          value={messageText}
          rows={4}
          onChange={e => setMessageText(e.target.value)}
          onBlur={handleMessageBlur}
          placeholder="Message sent to the customer"
        />
      </div>

      {/* is_start toggle */}
      <div className={styles.toggleRow}>
        <label className={styles.toggleLabel} htmlFor={`start-${step.id}`}>
          <div>
            <div className={styles.toggleTitle}>Start step</div>
            <div className={styles.toggleSub}>This step is the entry point of the flow.</div>
          </div>
          <div className={styles.toggle}>
            <input
              id={`start-${step.id}`}
              type="checkbox"
              className={styles.toggleInput}
              checked={step.is_start}
              onChange={e => handleStartToggle(e.target.checked)}
            />
            <div className={styles.toggleTrack} />
          </div>
        </label>
      </div>

      {/* Options */}
      <div className={styles.optionsSection}>
        <div className={styles.optionsHeader}>
          <span className={styles.fieldLabel}>Reply options</span>
        </div>

        {step.options.length === 0 && (
          <p className={styles.noOptions}>No options — this step ends the flow when reached.</p>
        )}

        <div className={styles.optionsList}>
          {step.options.map(opt => (
            <OptionRow
              key={opt.id}
              opt={opt}
              steps={steps}
              currentStepId={step.id}
              tenantId={tenantId}
            />
          ))}
        </div>

        {step.options.length > 3 && (
          <p className={styles.listWarn}>
            ⚠ {step.options.length} options — sent as a list message on WhatsApp.
          </p>
        )}

        <button className={styles.addOptBtn} onClick={handleAddOption} disabled={createOpt.isPending}>
          + Add option
        </button>
      </div>

      {/* Delete step */}
      <div className={styles.dangerZone}>
        <button
          className={styles.deleteStepBtn}
          onClick={handleDeleteStep}
          disabled={deleteStep.isPending}
        >
          {deleteStep.isPending ? 'Deleting…' : 'Delete step'}
        </button>
      </div>
    </div>
  );
}

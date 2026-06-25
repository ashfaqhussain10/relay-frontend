import { useState, useEffect } from 'react';
import type { FlowStep } from '../types';
import styles from './PhonePreview.module.css';

interface Props {
  steps: FlowStep[];
}

export default function PhonePreview({ steps }: Props) {
  const [channel, setChannel] = useState<'whatsapp' | 'instagram'>('whatsapp');
  const [currentStepId, setCurrentStepId] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);

  const startStep = steps.find(s => s.is_start);

  // Reset when start step changes or steps are removed
  useEffect(() => {
    setCurrentStepId(null);
    setEnded(false);
  }, [startStep?.id]);

  useEffect(() => {
    const ids = new Set(steps.map(s => s.id));
    if (currentStepId !== null && !ids.has(currentStepId)) {
      setCurrentStepId(null);
      setEnded(false);
    }
  }, [steps, currentStepId]);

  const currentStep = currentStepId
    ? steps.find(s => s.id === currentStepId) ?? startStep
    : startStep;

  const handleReset = () => {
    setCurrentStepId(null);
    setEnded(false);
  };

  const handleOptionTap = (nextStepId: number | null) => {
    if (nextStepId === null) {
      setEnded(true);
    } else {
      setCurrentStepId(nextStepId);
      setEnded(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>Live preview</div>

      {/* Channel toggle */}
      <div className={styles.channelToggle}>
        <button
          className={`${styles.chanBtn} ${channel === 'whatsapp' ? styles.chanWa : ''}`}
          onClick={() => { setChannel('whatsapp'); handleReset(); }}
        >
          WhatsApp
        </button>
        <button
          className={`${styles.chanBtn} ${channel === 'instagram' ? styles.chanIg : ''}`}
          onClick={() => { setChannel('instagram'); handleReset(); }}
        >
          Instagram
        </button>
      </div>

      {/* Phone frame */}
      <div className={`${styles.phone} ${styles[channel]}`}>
        {/* Status bar */}
        <div className={styles.statusBar}>
          <span>9:41</span>
          <span>●●●</span>
        </div>

        {/* App header */}
        <div className={`${styles.appHeader} ${styles[`${channel}Header`]}`}>
          <div className={styles.headerAvatar}>{channel === 'whatsapp' ? '🤖' : '📸'}</div>
          <div className={styles.headerInfo}>
            <div className={styles.headerName}>Relay Bot</div>
            <div className={styles.headerSub}>{channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}</div>
          </div>
        </div>

        {/* Chat body */}
        <div className={styles.chatBody}>
          {!startStep ? (
            <div className={styles.emptyPreview}>
              No start step defined yet. Add a step and mark it as Start.
            </div>
          ) : (
            <>
              {/* Bot message */}
              {currentStep && (
                <div className={styles.botRow}>
                  <div className={`${styles.bubble} ${styles[`${channel}Bubble`]}`}>
                    {currentStep.message_text || <em style={{ color: 'var(--ink3)' }}>(No message text)</em>}
                  </div>
                </div>
              )}

              {/* Options or end state */}
              {ended ? (
                <div className={styles.endPill}>✓ Flow ended</div>
              ) : currentStep && currentStep.options.length > 0 ? (
                <div className={styles.optionsArea}>
                  {currentStep.options.map(opt => {
                    const target = opt.next_step
                      ? steps.find(s => s.id === opt.next_step)
                      : null;
                    const isValid = opt.next_step === null || target !== undefined;
                    return (
                      <button
                        key={opt.id}
                        className={`${styles.optBtn} ${styles[`${channel}Opt`]} ${!isValid ? styles.optBroken : ''}`}
                        onClick={() => isValid && handleOptionTap(opt.next_step)}
                        disabled={!isValid}
                        title={!isValid ? 'Target step is missing' : undefined}
                      >
                        {opt.button_label || '(empty label)'}
                      </button>
                    );
                  })}
                </div>
              ) : currentStep ? (
                <div className={styles.endPill}>Flow ends here</div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <button className={styles.resetBtn} onClick={handleReset}>↺ Reset</button>
    </div>
  );
}

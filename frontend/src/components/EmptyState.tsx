import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface Props {
  icon?: ReactNode;
  heading: string;
  subtext?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, heading, subtext, action }: Props) {
  return (
    <div className={styles.root}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <p className={styles.heading}>{heading}</p>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

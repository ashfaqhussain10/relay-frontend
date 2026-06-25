import type { ReactNode } from 'react';
import styles from './StatCard.module.css';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
}

export default function StatCard({ label, value, sub, icon }: Props) {
  return (
    <div className={styles.card}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}

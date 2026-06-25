import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Variant = 'live' | 'inactive' | 'whatsapp' | 'instagram' | 'completed' | 'handedoff' | 'active' | 'handoff';

interface Props {
  variant: Variant;
  children: ReactNode;
}

export default function Badge({ variant, children }: Props) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}

import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({ children, padding = 'md', className = '', ...rest }: Props) {
  return (
    <div className={`${styles.card} ${styles[`p-${padding}`]} ${className}`} {...rest}>
      {children}
    </div>
  );
}

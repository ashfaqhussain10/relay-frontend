import styles from './Spinner.module.css';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export default function Spinner({ size = 'md', fullPage }: Props) {
  const spinner = <span className={`${styles.spinner} ${styles[size]}`} role="status" aria-label="Loading" />;
  if (fullPage) return <div className={styles.fullPage}>{spinner}</div>;
  return spinner;
}

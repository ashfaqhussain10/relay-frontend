import styles from './SkeletonRow.module.css';

export default function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className={styles.row}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className={styles.cell}>
          <span
            className={styles.skel}
            style={{ width: i === 0 ? '55%' : i === cols - 1 ? '30%' : '75%' }}
          />
        </td>
      ))}
    </tr>
  );
}

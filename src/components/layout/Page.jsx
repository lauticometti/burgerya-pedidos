import styles from './Page.module.css';
import OpenTodayAlert from '../alerts/OpenTodayAlert';

export default function Page({ children, className = '' }) {
  const classes = [styles.page, className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <OpenTodayAlert />
      {children}
    </div>
  );
}

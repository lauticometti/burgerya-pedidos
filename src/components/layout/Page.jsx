import styles from './Page.module.css';
import OpenTodayAlert from '../alerts/OpenTodayAlert';
import ClosedBanner from '../alerts/ClosedBanner';

export default function Page({ children, className = '' }) {
  const classes = [styles.page, className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <ClosedBanner />
      <OpenTodayAlert />
      {children}
    </div>
  );
}

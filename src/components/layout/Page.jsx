import styles from './Page.module.css';
import OpenTodayAlert from '../alerts/OpenTodayAlert';
import ClosedBanner from '../alerts/ClosedBanner';
import TodayScheduleLine from '../alerts/TodayScheduleLine';

export default function Page({ children, className = '' }) {
  const classes = [styles.page, className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <ClosedBanner />
      <TodayScheduleLine />
      <OpenTodayAlert />
      {children}
    </div>
  );
}

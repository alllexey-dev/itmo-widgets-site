import { Card, Icon } from '../../ui';
import styles from './LoginPage.module.css';

export function LoginPage() {
  return (
    <main className={styles.page}>
      <Card padding="large" className={styles.card}>
        <div className={styles.brand}>
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="" width={40} height={40} />
          <span>ITMO.Widgets</span>
        </div>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.text}>
          <Icon name="smartphone" size={20} />
          Вход через приложение скоро появится здесь.
        </p>
      </Card>
    </main>
  );
}

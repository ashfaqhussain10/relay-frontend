import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import Spinner from '../components/Spinner';
import styles from './Login.module.css';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type Fields = z.infer<typeof schema>;

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try {
      await login(data.username, data.password);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Login failed. Try again.',
      });
    }
  };

  return (
    <div className={styles.root}>
      {/* Left — brand panel */}
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.brandLogo}>R</div>
          <h1 className={styles.brandName}>Relay</h1>
          <p className={styles.brandTagline}>
            The multi-tenant chatbot platform for WhatsApp &amp; Instagram.
          </p>
          <ul className={styles.brandFeatures}>
            <li>Configure flows, no code required</li>
            <li>WhatsApp &amp; Instagram in one place</li>
            <li>Human handoff when it matters</li>
          </ul>
        </div>
      </div>

      {/* Right — form panel */}
      <div className={styles.form}>
        <div className={styles.formInner}>
          <h2 className={styles.heading}>Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {errors.root && (
              <div className={styles.formError} role="alert">
                {errors.root.message}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                aria-invalid={!!errors.username}
                {...register('username')}
              />
              {errors.username && <span className={styles.fieldError}>{errors.username.message}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
            </div>

            <button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className={styles.note}>Secure session · HTTPS only · no public registration</p>
        </div>
      </div>
    </div>
  );
}

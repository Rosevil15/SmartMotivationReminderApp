import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
  IonToast,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInputPasswordToggle,
} from '@ionic/react';
import { sparkles, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { supabase } from '../lib/supabaseClient';

type AuthMode = 'login' | 'signup';

const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setToast({ message: 'Please enter your email and password.', color: 'warning' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // App.tsx auth listener will redirect automatically
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setToast({
          message: 'Account created! Check your email to confirm, then log in.',
          color: 'success',
        });
        setMode('login');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setToast({ message: msg, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-container">
          {/* Hero section */}
          <div className="login-hero">
            <IonIcon icon={sparkles} className="login-hero-icon" />
            <h1 className="login-title">Smart Motivation</h1>
            <p className="login-subtitle">Stay on track. Stay motivated.</p>
          </div>

          {/* Card */}
          <div className="login-card">
            {/* Tab switcher */}
            <IonSegment
              value={mode}
              onIonChange={(e) => setMode(e.detail.value as AuthMode)}
              className="login-segment"
            >
              <IonSegmentButton value="login">
                <IonLabel>Log In</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="signup">
                <IonLabel>Sign Up</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Email */}
              <div className="login-input-wrapper">
                <IonIcon icon={mailOutline} className="login-input-icon" />
                <IonInput
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value ?? '')}
                  autocomplete="email"
                  className="login-input"
                  required
                />
              </div>

              {/* Password */}
              <div className="login-input-wrapper">
                <IonIcon icon={lockClosedOutline} className="login-input-icon" />
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value ?? '')}
                  autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="login-input"
                  required
                >
                  <IonInputPasswordToggle slot="end" />
                </IonInput>
              </div>

              {/* Submit */}
              <IonButton
                expand="block"
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? (
                  <IonSpinner name="crescent" />
                ) : mode === 'login' ? (
                  'Log In'
                ) : (
                  'Create Account'
                )}
              </IonButton>
            </form>

            <p className="login-footer-text">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => setMode('signup')}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => setMode('login')}
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <IonToast
          isOpen={!!toast}
          message={toast?.message ?? ''}
          duration={4000}
          color={toast?.color ?? 'danger'}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>

      <style>{`
        .login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100%;
          padding: 24px 16px;
          box-sizing: border-box;
          background: linear-gradient(
            160deg,
            var(--ion-color-primary-shade) 0%,
            var(--ion-color-primary) 50%,
            var(--ion-color-primary-tint) 100%
          );
        }

        .login-hero {
          text-align: center;
          margin-bottom: 32px;
          color: #fff;
        }

        .login-hero-icon {
          font-size: 3.5rem;
          margin-bottom: 8px;
          display: block;
        }

        .login-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }

        .login-subtitle {
          font-size: 1rem;
          margin: 0;
          opacity: 0.85;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: var(--ion-background-color, #fff);
          border-radius: 20px;
          padding: 28px 24px 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
        }

        .login-segment {
          margin-bottom: 24px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .login-input-wrapper {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--ion-color-light-shade, #ddd);
          border-radius: 12px;
          padding: 4px 12px;
          background: var(--ion-color-light, #f4f5f8);
          transition: border-color 0.2s;
        }

        .login-input-wrapper:focus-within {
          border-color: var(--ion-color-primary);
        }

        .login-input-icon {
          font-size: 1.2rem;
          color: var(--ion-color-medium);
          margin-right: 8px;
          flex-shrink: 0;
        }

        .login-input {
          flex: 1;
          --background: transparent;
          --padding-start: 0;
          --padding-end: 0;
        }

        .login-button {
          margin-top: 8px;
          --border-radius: 12px;
          height: 48px;
          font-size: 1rem;
          font-weight: 600;
        }

        .login-footer-text {
          text-align: center;
          margin: 16px 0 0;
          font-size: 0.9rem;
          color: var(--ion-color-medium);
        }

        .login-link {
          background: none;
          border: none;
          color: var(--ion-color-primary);
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
          text-decoration: underline;
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .login-card {
            background: var(--ion-card-background, #1e1e1e);
          }

          .login-input-wrapper {
            background: var(--ion-color-step-100, #2a2a2a);
            border-color: var(--ion-color-step-200, #414141);
          }
        }

        /* Responsive: larger screens center the card nicely */
        @media (min-width: 480px) {
          .login-container {
            padding: 40px 24px;
          }

          .login-title {
            font-size: 2.4rem;
          }
        }
      `}</style>
    </IonPage>
  );
};

export default Login;

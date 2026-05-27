import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OnboardingShell } from '../components/layout/OnboardingShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell>
      <ScreenHeader
        left={
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
            <Icon name="back" size={22} stroke="var(--text)" />
          </button>
        }
      />

      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 24px 32px', gap: 20 }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1 }}>Kirish</div>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>Hisobingizga kiring</div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,82,82,0.1)',
              border: '1px solid rgba(255,82,82,0.3)',
              fontSize: 13,
              color: '#FF5252',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <InputField
            label="EMAIL"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="email@example.com"
            autoComplete="email"
          />
          <InputField
            label="PAROL"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div style={{ flex: 1 }} />

        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={loading || !email || !password}
        >
          {loading ? 'Kirilmoqda...' : 'Kirish'}
        </Button>

        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Hisob yo'qmi?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{ color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
          >
            Ro'yxatdan o'tish
          </span>
        </div>
      </form>
    </OnboardingShell>
  );
}

function InputField({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        transition: 'border-color 0.2s',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          marginBottom: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 15.5,
          fontWeight: 500,
          color: 'var(--text)',
          fontFamily: 'var(--font)',
          padding: 0,
        }}
      />
    </div>
  );
}

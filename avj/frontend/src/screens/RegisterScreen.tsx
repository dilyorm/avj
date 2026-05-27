import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../components/layout/OnboardingShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';

export function RegisterScreen() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — identity
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [city, setCity] = useState('Toshkent');

  // Step 2 — credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) { setError('Ism va username kiritish shart'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Parollar mos kelmadi"); return; }
    if (password.length < 6)  { setError("Parol kamida 6 ta belgidan iborat bo'lsin"); return; }
    setError('');
    setLoading(true);
    try {
      await register({ name, handle, email, password, city });
      navigate('/connect');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ro\'yxatdan o\'tish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell>
      <ScreenHeader
        left={
          <button
            onClick={() => step === 2 ? setStep(1) : navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}
          >
            <Icon name="back" size={22} stroke="var(--text)" />
          </button>
        }
        right={
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {step} / 2
          </div>
        }
      />

      {step === 1 ? (
        <form onSubmit={handleStep1} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 24px 32px', gap: 20 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8 }}>O'zingni tanishtir</div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
              Do'stlaring seni shu nom bilan topadi.
            </div>
          </div>

          {/* Avatar preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar name={name || 'U'} size={96} />
          </div>

          {error && <ErrorBox message={error} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InputField label="ISM" value={name} onChange={setName} placeholder="Ismingni kiriting" autoComplete="name" />
            <InputField
              label="USERNAME"
              value={handle}
              onChange={v => setHandle(v.replace(/[^a-z0-9._]/gi, '').toLowerCase())}
              placeholder="username"
              hint={handle ? `avj.app/@${handle}` : undefined}
              prefix="@"
            />
            <InputField label="SHAHAR" value={city} onChange={setCity} placeholder="Toshkent" />
          </div>

          <div style={{ flex: 1 }} />

          <Button variant="primary" size="lg" type="submit" disabled={!name.trim() || !handle.trim()}>
            Davom etish
          </Button>

          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Hisobim bor?{' '}
            <span onClick={() => navigate('/login')} style={{ color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>
              Kirish
            </span>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 24px 32px', gap: 20 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8 }}>Hisob ma'lumotlari</div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
              Kirish uchun email va parol.
            </div>
          </div>

          {error && <ErrorBox message={error} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InputField label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="email@example.com" autoComplete="email" />
            <InputField label="PAROL" type="password" value={password} onChange={setPassword} placeholder="Kamida 6 ta belgi" autoComplete="new-password" />
            <InputField label="PAROLNI TASDIQLANG" type="password" value={confirm} onChange={setConfirm} placeholder="Parolni qaytaring" autoComplete="new-password" />
          </div>

          <div style={{ flex: 1 }} />

          <Button variant="primary" size="lg" type="submit" disabled={loading || !email || !password || !confirm}>
            {loading ? 'Yaratilmoqda...' : "Ro'yxatdan o'tish"}
          </Button>
        </form>
      )}
    </OnboardingShell>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12,
      background: 'rgba(255,82,82,0.1)',
      border: '1px solid rgba(255,82,82,0.3)',
      fontSize: 13, color: '#FF5252',
    }}>
      {message}
    </div>
  );
}

function InputField({
  label, type = 'text', value, onChange, placeholder, autoComplete, hint, prefix,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; hint?: string; prefix?: string;
}) {
  return (
    <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {prefix && <span style={{ fontSize: 15.5, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>{prefix}</span>}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15.5, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font)', padding: 0 }}
        />
      </div>
      {hint && <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{hint}</div>}
    </div>
  );
}

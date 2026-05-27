import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '../components/layout/OnboardingShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Avatar } from '../components/ui/Avatar';
import { Icon } from '../components/ui/Icon';

export function ProfileSetupScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('Ozoda Karimova');
  const [username, setUsername] = useState('@ozoda');

  return (
    <OnboardingShell>
      <ScreenHeader
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4 }}>
            <Icon name="back" size={22} stroke="var(--text)" />
          </button>
        }
        right={
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>2 / 3</div>
        }
      />

      <div style={{ flex: 1, padding: '4px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1 }}>
            O'zingni tanishtir
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Do'stlaring seni shu nom va @manzil orqali topadi.
          </div>
        </div>

        {/* Avatar picker */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={name || 'U'} size={104} />
            <button
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 34,
                height: 34,
                borderRadius: 17,
                background: 'var(--text)',
                color: 'var(--bg)',
                border: '3px solid var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name="plus" size={16} stroke="var(--bg)" sw={2.4} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field
            label="ISM"
            value={name}
            onChange={setName}
            placeholder="Ismingni kiriting"
          />
          <Field
            label="USERNAME"
            value={username}
            onChange={setUsername}
            hint={username ? `avj.app/${username.replace('@', '')}` : undefined}
            placeholder="@username"
          />
        </div>

        <div style={{ flex: 1 }} />

        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/connect')}
          disabled={!name.trim() || !username.trim()}
        >
          Davom etish
        </Button>
      </div>
    </OnboardingShell>
  );
}

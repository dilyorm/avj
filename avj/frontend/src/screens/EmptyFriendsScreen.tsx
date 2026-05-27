import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyArt } from '../components/ui/EmptyArt';
import { ME, SUGGESTIONS } from '../data';

export function EmptyFriendsScreen() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <ScreenHeader
        title="Lenta"
        right={<Avatar name={ME.name} size={32} live onClick={() => navigate('/profile')} />}
      />

      <div
        style={{
          flex: 1,
          padding: '8px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 18,
        }}
      >
        <EmptyArt glyph="globe" />

        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15 }}>
            Lenta hozircha bo'sh
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            Bir nechta do'st qo'shsang — ular nima eshityotgani shu yerda paydo bo'ladi.
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" size="md" icon="plus" onClick={() => navigate('/friends/add')}>
            Do'st qo'shish
          </Button>
          <Button variant="ghost" size="md" icon="tg">
            Telegram orqali taklif qil
          </Button>
        </div>

        {/* Peek at who's already on Avj */}
        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 14,
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex' }}>
            {SUGGESTIONS.slice(0, 3).map((s, i) => (
              <div key={s.id} style={{ marginLeft: i === 0 ? 0 : -8, borderRadius: '50%', border: '2px solid var(--surface)' }}>
                <Avatar name={s.name} size={26} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', textAlign: 'left', lineHeight: 1.4 }}>
            <b style={{ color: 'var(--text)' }}>Kamila, Otabek</b> va 32 boshqa tanishing Avj-da
          </div>
        </div>
      </div>
    </AppShell>
  );
}

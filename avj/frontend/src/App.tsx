import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FeedProvider } from './context/FeedContext';

import { WelcomeScreen }       from './screens/WelcomeScreen';
import { LoginScreen }         from './screens/LoginScreen';
import { RegisterScreen }      from './screens/RegisterScreen';
import { ProfileSetupScreen }  from './screens/ProfileSetupScreen';
import { ConnectMusicScreen }  from './screens/ConnectMusicScreen';
import { HomeCardsScreen }     from './screens/HomeCardsScreen';
import { HomeListScreen }      from './screens/HomeListScreen';
import { HomeStackScreen }     from './screens/HomeStackScreen';
import { SongDetailScreen }    from './screens/SongDetailScreen';
import { FriendProfileScreen } from './screens/FriendProfileScreen';
import { AddFriendsScreen }    from './screens/AddFriendsScreen';
import { MyProfileScreen }     from './screens/MyProfileScreen';
import { SearchScreen }        from './screens/SearchScreen';

/** Redirect to /login if not authenticated */
function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            fontSize: 48, fontWeight: 800, letterSpacing: -2.5,
            color: 'var(--text)', fontFamily: 'var(--font)',
          }}>
            avj<span style={{ color: 'var(--accent)' }}>.</span>
          </div>
          <div style={{ width: 32, height: 2, background: 'var(--accent)', borderRadius: 1, animation: 'avj-fade-up 0.5s ease-out infinite alternate' }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public — onboarding */}
      <Route path="/"         element={<WelcomeScreen />} />
      <Route path="/login"    element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />

      {/* Semi-public — after register, before full onboard */}
      <Route path="/setup"   element={<Protected><ProfileSetupScreen /></Protected>} />
      <Route path="/connect" element={<Protected><ConnectMusicScreen /></Protected>} />

      {/* Protected app routes — wrapped in FeedProvider for real-time data */}
      <Route path="/home" element={
        <Protected>
          <FeedProvider>
            <HomeCardsScreen />
          </FeedProvider>
        </Protected>
      } />
      <Route path="/home/list" element={
        <Protected>
          <FeedProvider>
            <HomeListScreen />
          </FeedProvider>
        </Protected>
      } />
      <Route path="/home/stack" element={
        <Protected>
          <FeedProvider>
            <HomeStackScreen />
          </FeedProvider>
        </Protected>
      } />

      <Route path="/song/:id"    element={<Protected><SongDetailScreen /></Protected>} />
      <Route path="/friend/:id"  element={<Protected><FriendProfileScreen /></Protected>} />
      <Route path="/friends/add" element={<Protected><AddFriendsScreen /></Protected>} />
      <Route path="/search"      element={<Protected><SearchScreen /></Protected>} />
      <Route path="/profile"     element={<Protected><MyProfileScreen /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

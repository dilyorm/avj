export type Platform = 'spotify' | 'yandex';
export type ListeningStatus = 'live' | 'past';

export interface NowPlaying {
  song: string;
  artist: string;
  album: string;
  platform: Platform;
}

export interface Friend {
  id: string;
  name: string;
  handle: string;
  song: string;
  artist: string;
  album: string;
  platform: Platform;
  status: ListeningStatus;
  ago: string;
  mins: string | null;
  spotify?: boolean;
  yandex?: boolean;
}

export interface User {
  name: string;
  handle: string;
  city: string;
  spotify: boolean;
  yandex: boolean;
  now: NowPlaying;
  friendCount?: number;
  trackCount?: number;
}

export interface Suggestion {
  id: string;
  name: string;
  handle: string;
  mutual: number;
  source: string;
  added?: boolean;
}

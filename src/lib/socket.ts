import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? window.location.origin : `http://${window.location.hostname}:3001`;

const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const guildId = urlParams?.get('guild_id') || undefined;

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  timeout: 5000,
  query: guildId ? { guildId } : {}
});

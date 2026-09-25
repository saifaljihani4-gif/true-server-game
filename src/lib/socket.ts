import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? window.location.origin : `http://${window.location.hostname}:3001`;

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  timeout: 5000,
});

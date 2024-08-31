import io, { Socket } from 'socket.io-client';
import useDiscordAuth from './useDiscordAuth';
import { computed, readonly, ref } from 'vue';

export type User = {
  avatar?: string
  id: string
}

export type FloatingPig = {
  id: number,  // For vue
  y: number,   // Percent
  x: number,   // Percent
  turn: number // Degrees
  distance: number // Percent
}

interface ListenEvents {
  oink: (data: { user_id: string, sound: number, pig: FloatingPig }) => void
  user_connected: (user: User) => void
  user_disconnected: (user_id: string) => void
  user_list: (users: User[]) => void
}

interface EmitEvents {
  oink: () => void
}

const socket: Socket<ListenEvents, EmitEvents> = io({
  autoConnect: false,
  path: '/.proxy/sio/socket.io'
});
const connected = ref(false);
const connecting = ref(false);
const error = ref<string | null>(null);

socket.on('connect', () => {
  error.value = null;
  connected.value = true;
  connecting.value = false;
});

socket.on('connect_error', (err) => {
  error.value = err.message;
  connecting.value = false
  console.error('Connection error:', err);
});

socket.on('disconnect', (reason) => {
  if (reason !== "io server disconnect")
    error.value = reason;

  console.error('Disconnected:', reason);
  connected.value = false;
});

export default function useSocket() {
  const { onAuthorized, authToken } = useDiscordAuth();

  onAuthorized(() => {
    if (connected.value || connecting.value) return;
    connecting.value = true;
    socket.auth = { token: authToken.value };
    socket.connect();
  });

  return {
    socket,
    connected: readonly(connected),
    connecting: readonly(connecting),
    error: computed(() => error.value && `Socket.IO error: ${error.value}`)
  };
}

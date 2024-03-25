import { onMounted, readonly, ref } from "vue";
import useDiscordSDK from "./useDiscordSDK";

type User = {
  id: string
  username: string
  avatar?: string,
  global_name?: string
};
type Callback = () => any;


// TODO: independent discordSDK
const loading = ref<boolean>(false);
const authenticatedUser = ref<User | null>(null);
const localToken = ref<string | null>(null);
const authError = ref<string | null>(null);
const callbacks: Callback[] = [];

export default function useDiscordAuth() {
  const { discordSdk } = useDiscordSDK();

  async function authenticate() {
    const { code } = await discordSdk.commands.authorize({
      client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
      response_type: 'code',
      prompt: 'none',
      scope: ['identify'],
    });

    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const { token, user } = await response.json();

    authenticatedUser.value = user;
    localToken.value = token;

    for (const callback of callbacks)
      callback();
  }

  const onAuthorized = (cb: Callback) => { callbacks.push(cb); }

  onMounted(async () => {
    await discordSdk.ready();
    if (loading.value || authenticatedUser.value) return;
    try {
      loading.value = true;
      authError.value = null;
      await authenticate();
    } catch (e) {
      authError.value = (e as any)?.message || 'Auth failed';
    }
    loading.value = false;
  });

  return {
    user: readonly(authenticatedUser),
    authToken: readonly(localToken),
    error: readonly(authError),
    loading: readonly(loading),
    onAuthorized
  }
}
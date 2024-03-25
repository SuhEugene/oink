import { DiscordSDK } from '@discord/embedded-app-sdk';
import { onMounted, readonly, ref } from 'vue';

let discordSdk: DiscordSDK | null = null;
const ready = ref(false);

export default function useDiscordSDK() {
  if (discordSdk === null)
    discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

  onMounted(async () => {
    if (ready.value || !discordSdk) return;
    await discordSdk.ready();
    ready.value = true;
  })

  return {
    discordSdk,
    ready: readonly(ready)
  };
}
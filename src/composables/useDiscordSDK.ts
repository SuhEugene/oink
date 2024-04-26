import { DiscordSDK, DiscordSDKMock } from '@discord/embedded-app-sdk';
import { onMounted, readonly, ref } from 'vue';

let discordSdk: DiscordSDK | DiscordSDKMock | null = null;
const ready = ref(false);

export default function useDiscordSDK() {
  const params = new URLSearchParams(window.location.search);
  console.log(params);

  if (discordSdk === null)
    discordSdk = params.get('frame_id')
      ? new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID)
      : new DiscordSDKMock(
        import.meta.env.VITE_DISCORD_CLIENT_ID,
        "946712507874152488",
        "1191473895086239824"
      );

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
<script setup lang="ts">
import useSounds from './composables/useSounds';
import useDiscordAuth from './composables/useDiscordAuth';
import useSocket from './composables/useSocket';
import { computed } from 'vue';

const { sounds, loadedSounds, soundsToLoad } = useSounds();
const { user, loading: authorizing, error: discordAuthError } = useDiscordAuth();
const { socket, connected, error: socketError } = useSocket();

const anyError = computed(() => discordAuthError.value || socketError.value);

</script>

<template>
  <main>
    <Transition mode="out-in">
      <div v-if="(loadedSounds < soundsToLoad) || authorizing" class="splash">
        <h2 class="splash-title">Loading...</h2>
        <div class="loading">
          <div class="loading-indicator" :style="{ width: `${loadedSounds / soundsToLoad * 100}%` }"></div>
        </div>
      </div>
      <div v-else-if="anyError" class="splash">
        <h2 class="splash-title">Error!</h2>
        <p>{{ anyError }}</p>
      </div>
      <div v-else class="users">
        <button @click.prevent="sounds[0].play();">Oink</button>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.splash {
  width: 100%;
  display: flex;
  flex-direction: column;
  place-items: center;
}

.splash-title {
  margin-bottom: 12px;
}

.loading {
  height: 5px;
  max-width: 500px;
  width: 100%;
  margin: 0 64px;
  background-color: var(--color-background-mute);
  border-radius: 5px;
  overflow: hidden;
}

.loading-indicator {
  height: 100%;
  background-color: var(--color-heading);
  transition: width .2s ease-in-out;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
./composables/useDiscordAuth
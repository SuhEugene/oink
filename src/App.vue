<script setup lang="ts">
import useSounds from './composables/useSounds';
import useDiscordAuth from './composables/useDiscordAuth';
import useSocket from './composables/useSocket';
import type { User, FloatingPig } from './composables/useSocket';
import { computed, onMounted, ref } from 'vue';
import useDiscordSDK from './composables/useDiscordSDK';

let playingSince = Date.now();
let oinks = 0;
const { playSound, loadedSounds, soundsToLoad } = useSounds();
const { user, error: discordAuthError, onAuthorized } = useDiscordAuth();
const { socket, connected, error: socketError } = useSocket();

const anyError = computed(() => discordAuthError.value || socketError.value);

const allUsers = ref<User[]>([]);

socket.on('user_list', users => allUsers.value = users);
socket.on('user_connected', user => allUsers.value.push(user));
socket.on('user_disconnected', user_id => allUsers.value = allUsers.value.filter(u => u.id !== user_id));

socket.on('disconnect', () => allUsers.value = []);

const floatingPigs = ref<Record<string, FloatingPig[]>>({});

socket.on('oink', ({ user_id, sound, pig }) => {
  playSound(sound);

  if (!floatingPigs.value[user_id])
    floatingPigs.value[user_id] = [];

  floatingPigs.value[user_id].push(pig);

  setTimeout(() => {
    const index = floatingPigs.value[user_id].findIndex(p => p.id === pig.id);
    if (index === -1) return;
    floatingPigs.value[user_id].splice(index, 1);
  }, 3000)
})

function setActivity() {
  discordSdk.commands.setActivity({
    activity: {
      type: 0,
      details: `Made ${oinks} oinks`,
      state: `Oinking ${allUsers.value.length <= 1 ? 'solo' : 'with friends'}`,
      assets: {
        large_image: 'pig',
        large_text: "OINK!!!"
      },
      party: {
        id: discordSdk.instanceId,
        size: [Math.max(allUsers.value.length, 1), 12]
      },
      timestamps: { start: playingSince }
    }
  });
}
onAuthorized(setActivity);

async function doOink() {
  socket.emit('oink');
  oinks++;
  setActivity();
}

const loadingParts = computed(() => {
  const parts = [
    user.value,
    connected.value
  ];

  return {
    loaded: parts.reduce((v1, v2) => {
      if (v2) return (v1 as number) + 1;
      return v1;
    }, 0) as number,
    total: parts.length
  };
});

const { discordSdk } = useDiscordSDK();

onMounted(async () => {
  await discordSdk.ready();
  playingSince = Date.now();
})


</script>

<template>
  <main>
    <Transition mode="out-in">
      <div v-if="anyError" class="splash">
        <h2 class="splash-title">Error!</h2>
        <p>{{ anyError }}</p>
      </div>
      <div v-else-if="(loadedSounds < soundsToLoad) || loadingParts.loaded < loadingParts.total" class="splash">
        <h2 class="splash-title">Loading...</h2>
        <div class="loading">
          <div class="loading-indicator"
            :style="{ width: `${(loadedSounds + loadingParts.loaded) / (soundsToLoad + loadingParts.total) * 100}%` }">
          </div>
        </div>
      </div>
      <div v-else class="oink">
        <div class="users">
          <div v-for="user in allUsers" :key="user.id" class="user">
            <img v-if="user.avatar" class="user__avatar"
              :src="`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=128`" draggable="false">
            <img v-else class="user__avatar user__avatar--none" src="@/assets/images/pig92.png" alt="">
            <div v-for="pig in (floatingPigs[user.id] || [])" :key="pig.id" class="floating-pig"
              :style="{ '--pig-x': `${pig.x}%`, '--pig-y': `${pig.y}%`, '--pig-turn': `${pig.turn}deg`, '--pig-distance': `${pig.distance}%` }">
              <img src="@/assets/images/pig92.png">
            </div>
          </div>
        </div>
        <button class="oink-button" @click="doOink">
          Oink!
        </button>
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

.oink {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.users {
  --avatar-size: 92px;
  --gap-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  gap: var(--gap-size);
}

.user {
  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;
}

.user__avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 50%;
  box-shadow: 6px 6px 16px rgba(0, 0, 0, .18);
}

.user__avatar--none {
  filter: grayscale(1);
}

.floating-pig {
  position: absolute;
  width: 30%;
  height: 30%;
  z-index: 10;

  animation: pig-float linear 1.5s forwards;
}

.floating-pig img {
  width: 100%;
  height: 100%;

  box-shadow: 2px 2px 4px rgba(0, 0, 0, .15);
  border: 1px solid black;
  border-radius: 50%;
  transform: rotate(calc(-1 * var(--pig-turn)));
}

@keyframes pig-float {
  from {
    opacity: 0;
    transform: rotate(var(--pig-turn)) translate(var(--pig-x), var(--pig-y));
  }

  25% {
    opacity: 1;
  }

  75% {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: rotate(var(--pig-turn)) translate(calc(var(--pig-x) + var(--pig-distance)), calc(var(--pig-y) + var(--pig-distance)));
  }
}

.oink-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: 8px;
  font-size: 14px;
  transition: .13s background-color;
  background-color: #d897b2;
  color: #121212;

  border: none;

  height: 40px;
  padding: .5rem 1rem;

  margin-top: 40px;

  cursor: pointer;
}

@media (hover: hover) {
  .oink-button:hover {
    background-color: #c486a0;
  }
}

.oink-button:active {
  background-color: #b67c94;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

@media (max-height: 420px) {

  .users {
    --avatar-size: 64px;
    --gap-size: 12px;
  }
}

@media (max-height: 300px) {
  .oink-button {
    display: none;
  }

  .users {
    --avatar-size: 48px;
    --gap-size: 8px;
    overflow: hidden;
    height: calc(var(--avatar-size) + var(--avatar-size) + var(--gap-size));
  }
}
</style>
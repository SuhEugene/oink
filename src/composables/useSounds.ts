import { onMounted, readonly, ref } from 'vue';

const soundList = [
  import('@/assets/sounds/oink1.mp3'),
  import('@/assets/sounds/oink2.mp3'),
  import('@/assets/sounds/oink3.mp3'),
  import('@/assets/sounds/oink4.mp3'),
];

export default function useSounds() {
  const loadedSounds = ref(0);
  const sounds: HTMLAudioElement[] = [];

  onMounted(async () => {
    for await (const sound of soundList) {
      const audio = new Audio(sound.default);
      audio.volume = 0.5;
      audio.addEventListener('loadeddata', () => { loadedSounds.value++ });
      sounds.push(audio);
    }
  });

  return {
    sounds,
    loadedSounds: readonly(loadedSounds),
    soundsToLoad: soundList.length
  };
}
import { onMounted, readonly, ref } from 'vue';

const soundList = [
  import('@/assets/sounds/oink1.mp3'),
  import('@/assets/sounds/oink2.mp3'),
  import('@/assets/sounds/oink3.mp3'),
  import('@/assets/sounds/oink4.mp3'),
];

const duplicates = 4;

export default function useSounds() {
  const loadedSounds = ref(0);
  const sounds: HTMLAudioElement[][] = [];
  const lastPlayed: number[] = new Array(soundList.length).fill(0);

  function playSound(index: number) {
    if (index < 0 || index >= soundList.length)
      return;

    const duplicateIndex = lastPlayed[index];
    lastPlayed[index] = (duplicateIndex + 1) % duplicates;

    const soundToPlay = sounds[index][duplicateIndex];
    if (!soundToPlay.paused && soundToPlay.currentTime >= 0.1)
      soundToPlay.currentTime = 0;

    soundToPlay.play();
  }

  onMounted(async () => {
    for await (const sound of soundList) {
      const audioElements = [];
      for (let i = 0; i < duplicates; i++) {
        const audio = new Audio(sound.default);
        audio.volume = 0.5;
        audio.addEventListener('loadeddata', () => { loadedSounds.value++ });
        audioElements.push(audio);
      }
      sounds.push(audioElements);
    }
  });

  return {
    sounds, playSound,
    loadedSounds: readonly(loadedSounds),
    soundsToLoad: soundList.length
  };
}
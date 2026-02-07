import Sound from 'react-native-sound';

Sound.setCategory('Playback');

export const playTTS = async (
  url: string,
  onAmplitude?: (value: number) => void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sound = new Sound(url, undefined, error => {
      if (error) {
        reject(error);
        return;
      }

      let interval: NodeJS.Timeout | null = null;

      if (onAmplitude) {
        interval = setInterval(() => {
          // Fake amplitude: random smooth value 0–1
          const amplitude = 0.3 + Math.random() * 0.7;
          onAmplitude(amplitude);
        }, 50); // update every 50ms
      }

      sound.play(success => {
        sound.release();
        if (interval) clearInterval(interval);
        if (!success) reject(new Error('Playback failed'));
        else resolve();
      });
    });
  });
};

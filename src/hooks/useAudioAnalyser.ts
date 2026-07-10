import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';

export function useAudioAnalyser(isPlaying: boolean) {
  const [freqData, setFreqData] = useState<Uint8Array>(new Uint8Array(0));
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(0));
  const reqRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      return;
    }

    const update = () => {
      setFreqData(audioEngine.getFrequencyData());
      setTimeData(audioEngine.getTimeDomainData());
      reqRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying]);

  return { freqData, timeData };
}

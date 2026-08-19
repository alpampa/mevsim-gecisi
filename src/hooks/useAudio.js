import { useCallback, useRef, useState } from 'react';

/**
 * Ses yöneticisi — YALNIZCA ElevenLabs mp3 oynatır.
 * Tarayıcının Web Speech API'si (yapay erkek sesi) KESİNLİKLE kullanılmaz.
 *
 * play(src, onEnded): parça bitince onEnded çağrılır.
 * Güvenlik ağı: mp3'in süresi bilindiği anda bir zamanlayıcı kurulur;
 * 'ended' olayı herhangi bir nedenle tetiklenmese bile süre dolunca
 * onEnded çağrılır. Böylece sıralı okuma asla takılmaz.
 */
export function useAudio() {
  const audioRef = useRef(null);
  const watchdogRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!audioRef.current) {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
  }

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const play = useCallback(
    (src, onEnded) => {
      clearWatchdog();
      const audio = audioRef.current;
      if (src) {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = () => {
          clearWatchdog();
          setIsPlaying(false);
          if (onEnded) onEnded();
        };
        // Dosya yüklenemezse zincir tıkanmasın
        audio.onerror = () => {
          clearWatchdog();
          setIsPlaying(false);
          if (onEnded) onEnded();
        };
        // Süre bilinince güvenlik zamanlayıcısı: ended çalışmasa bile ilerle
        audio.onloadedmetadata = () => {
          const duration = audio.duration;
          if (!isFinite(duration) || duration <= 0) return;
          clearWatchdog();
          watchdogRef.current = setTimeout(() => {
            // Hâlâ bu parça oynuyorsa ve bitmişse sonrakine geç
            if (!audio.paused && audio.currentTime > 0 && audio.currentTime >= duration - 0.25) {
              clearWatchdog();
              setIsPlaying(false);
              if (onEnded) onEnded();
            }
          }, duration * 1000 + 600);
        };
        audio.src = src;
        const result = audio.play();
        if (result && typeof result.catch === 'function') {
          // Otomatik oynatma engellenirse (iOS/Android) YAPAY SES ÇALINMAZ.
          // App bu reddi algılar ve kullanıcıya "Sesi Başlat" katmanını gösterir.
          result.then(() => setIsPlaying(true)).catch(() => {});
        } else {
          setIsPlaying(true);
        }
        return result;
      }
      if (onEnded) onEnded();
      return Promise.resolve();
    },
    [clearWatchdog]
  );

  // Duraklat: aynı parça, aynı yerden devam edilebilir (kuyruk korunur)
  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // Devam: duraklatılan parçayı kaldığı yerden sürdürür
  const resume = useCallback(() => {
    const audio = audioRef.current;
    // Parça zaten bitmişse yeniden başlatma (kuyruk zaten ilerlemiştir)
    if (!audio.src || audio.ended) return;
    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      result.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.onended = null;
    audio.onerror = null;
    audio.onloadedmetadata = null;
    clearWatchdog();
    setIsPlaying(false);
  }, [clearWatchdog]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audioRef.current.muted = next;
      if (next) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return next;
    });
  }, []);

  return { play, stop, pause, resume, toggleMute, muted, isPlaying };
}

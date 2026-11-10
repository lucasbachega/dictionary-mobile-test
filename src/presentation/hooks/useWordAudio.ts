import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

export type AudioMode = 'recording' | 'speech';

/**
 * Diferencial 1 — tocador de áudio com recursos nativos.
 * - Se a API trouxer a gravação da pronúncia, toca o mp3 (expo-audio) com progresso real.
 * - Caso contrário, usa a síntese de voz do sistema (expo-speech) como fallback.
 */
export function useWordAudio(audioUrl: string | undefined, text: string) {
  const mode: AudioMode = audioUrl ? 'recording' : 'speech';
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [speaking, setSpeaking] = useState(false);

  // Para a fala sintetizada ao trocar de palavra ou sair da tela.
  useEffect(() => {
    return () => {
      Speech.stop();
      setSpeaking(false);
    };
  }, [text]);

  const duration = status.duration || 0;
  const progress = mode === 'recording' && duration > 0 ? Math.min(status.currentTime / duration, 1) : 0;
  const isPlaying = mode === 'recording' ? status.playing : speaking;

  const toggle = useCallback(async () => {
    if (mode === 'speech') {
      if (speaking) {
        Speech.stop();
        setSpeaking(false);
        return;
      }
      setSpeaking(true);
      Speech.speak(text, {
        language: 'en-US',
        rate: 0.9,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }
    const finished = duration > 0 && status.currentTime >= duration - 0.05;
    if (finished || status.didJustFinish) await player.seekTo(0);
    player.play();
  }, [duration, mode, player, speaking, status.currentTime, status.didJustFinish, status.playing, text]);

  return {
    mode,
    isPlaying,
    isLoading: mode === 'recording' && (!status.isLoaded || status.isBuffering) && !status.playing,
    progress,
    toggle,
  };
}

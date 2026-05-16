// "Ding-dong" de novo pedido gerado via Web Audio API — sem dependência de asset.
//
// Chrome/Safari bloqueiam AudioContext até primeira interação do user (autoplay
// policy). Se o pedido chegar por push antes do user clicar em algo na página,
// o som fica silenciado. Pra resolver isso, ouvimos os primeiros click/keydown/
// touch e damos resume() no contexto — `installAudioUnlock()` é chamado uma vez
// no boot da app (App.tsx) e só roda até desbloquear, depois remove os listeners.

const DING_FREQ = 880; // A5
const DONG_FREQ = 660; // E5
const NOTE_DURATION_MS = 220;
const BURST_GAP_MS = 2000;
const DEFAULT_REPEATS = 3;

let ctx: AudioContext | null = null;
let unlockInstalled = false;

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (ctx && ctx.state !== "closed") return ctx;
  const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor() as AudioContext;
  return ctx;
};

/**
 * Liga listeners de gesture pra destravar o AudioContext na primeira interação
 * do user. Idempotente — chamadas extras são no-op. Os listeners se removem
 * sozinhos depois do primeiro disparo.
 */
export const installAudioUnlock = (): void => {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;

  const unlock = () => {
    const audio = getCtx();
    if (!audio) return;
    if (audio.state === "suspended") {
      audio.resume().catch(() => {});
    }
    // Toca um beep imperceptível (gain=0) só pra "armar" o contexto em alguns
    // browsers que ignoram resume() sem source ativa.
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.01);
    } catch {
      /* ignore */
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };

  window.addEventListener("click", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });
  window.addEventListener("touchstart", unlock, { once: false });
};

const playNote = (frequency: number, startSec: number, durationMs: number) => {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, audio.currentTime + startSec);
  gain.gain.linearRampToValueAtTime(0.25, audio.currentTime + startSec + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + startSec + durationMs / 1000);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + startSec);
  osc.stop(audio.currentTime + startSec + durationMs / 1000 + 0.05);
};

const playDingDong = (startSec: number) => {
  playNote(DING_FREQ, startSec, NOTE_DURATION_MS);
  playNote(DONG_FREQ, startSec + 0.25, NOTE_DURATION_MS);
};

/** Toca ding-dong N vezes com BURST_GAP_MS entre cada (default 3x). */
export const playNewOrderAlert = (repeats: number = DEFAULT_REPEATS) => {
  const audio = getCtx();
  if (!audio) return;
  // Browser pode ter suspended o AudioContext até primeiro gesture
  if (audio.state === "suspended") {
    audio.resume().catch(() => {});
  }
  for (let i = 0; i < repeats; i++) {
    playDingDong((i * BURST_GAP_MS) / 1000);
  }
};

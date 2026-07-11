/**
 * Tiny Web Audio sound engine for schedule alerts — no audio assets needed.
 * Browsers only allow an AudioContext after a user gesture, so `initAudio`
 * is wired to the first click/keydown of the session.
 */
let audioContext: AudioContext | null = null;

export function initAudio() {
  if (audioContext) return;
  if (typeof window === "undefined") return;
  audioContext = new AudioContext();
}

function playTone(
  frequencies: number[],
  { duration = 0.18, gap = 0.12, volume = 0.2 } = {},
) {
  if (!audioContext) return;
  if (audioContext.state === "suspended") void audioContext.resume();

  frequencies.forEach((frequency, index) => {
    const start = audioContext!.currentTime + index * (duration + gap);
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext!.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  });
}

/** Gentle two-note chime for "starts in N minutes" reminders. */
export function playReminderChime() {
  playTone([880, 1174.66]);
}

/** Firmer three-note tone for "due now" alerts. */
export function playDueAlert() {
  playTone([659.25, 659.25, 987.77], { volume: 0.3 });
}

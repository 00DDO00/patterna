/**
 * Mobile web audio unlock.
 * Browsers block audio until a user gesture. This unlocks on first touch/click.
 */

let unlocked = false;
let context: AudioContext | null = null;

function getAudioContext(): AudioContext {
  const win = typeof window !== 'undefined' ? window : (globalThis as unknown as Window);
  const AC = (win as Window & { AudioContext?: typeof AudioContext }).AudioContext
    || (win as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) throw new Error('No AudioContext');
  return new AC();
}

/**
 * Unlock audio. Call on first user interaction (touch/click).
 * Idempotent - safe to call multiple times. Reuses same context.
 */
export function unlockAudio(): AudioContext | null {
  if (context) return context;
  if (typeof window === 'undefined') return null;

  try {
    const ctx = getAudioContext();
    context = ctx;

    // Schedule a brief sound in the gesture handler (sync).
    // Mobile browsers require this to unlock audio.
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    osc.frequency.value = 440;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(0.1);

    ctx.resume().then(() => {
      unlocked = true;
    }).catch(() => {});
  } catch {
    context = null;
  }

  return context;
}

/**
 * Get the unlocked context, or null if not yet unlocked.
 */
export function getUnlockedContext(): AudioContext | null {
  return unlocked ? context : null;
}

/**
 * Check if audio has been unlocked.
 */
export function isUnlocked(): boolean {
  return unlocked;
}

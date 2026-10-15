/**
 * UI sound effects, synthesized with the Web Audio API.
 *
 * No audio files — tones are generated on demand from an oscillator with a
 * short exponential envelope. That means zero bundle cost, no CDN, no
 * licensing, and pitch/duration can be tuned in one place.
 *
 * Browsers block audio until the user has interacted with the page. The
 * context is created lazily on first play; if creation fails (autoplay
 * policy, unsupported browser), every call is a silent no-op.
 *
 * Toggle state lives in localStorage under `tagoption.sound`. Absence of
 * the key means ON — users who never touch the toggle get the sound.
 */

const KEY = "tagoption.sound";
let ctx = null;

function isEnabled() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tagoption:sound"));
  }
}

export function isSoundEnabled() {
  return isEnabled();
}

function getCtx() {
  if (ctx) return ctx;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * A single tone. `offsetMs` delays its start so a two-note chime can be
 * written as two calls rather than a scheduler.
 */
function tone({ freq, duration = 0.12, gain = 0.08, type = "sine", offsetMs = 0 }) {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume().catch(() => {});

  const start = audio.currentTime + offsetMs / 1000;
  const osc = audio.createOscillator();
  const amp = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  // Short attack, exponential decay. A hard cut at the end clicks, so
  // ramp to a very low value rather than zero.
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

const EVENTS = {
  // Trade placed — a short neutral click.
  place: () => tone({ freq: 620, duration: 0.08, gain: 0.06 }),

  // Trade won — rising two-note.
  win: () => {
    tone({ freq: 660, duration: 0.11, gain: 0.07 });
    tone({ freq: 990, duration: 0.16, gain: 0.07, offsetMs: 90 });
  },

  // Trade lost — flat low note. Not harsh.
  loss: () => tone({ freq: 220, duration: 0.18, gain: 0.06, type: "triangle" }),

  // Auto-run start — ascending triad.
  "auto-start": () => {
    tone({ freq: 523, duration: 0.10, gain: 0.06 });
    tone({ freq: 659, duration: 0.10, gain: 0.06, offsetMs: 80 });
    tone({ freq: 784, duration: 0.16, gain: 0.06, offsetMs: 160 });
  },

  // Auto-run stop — descending two-note.
  "auto-stop": () => {
    tone({ freq: 659, duration: 0.11, gain: 0.06 });
    tone({ freq: 440, duration: 0.18, gain: 0.06, offsetMs: 90 });
  },
};

export function play(event) {
  if (!isEnabled()) return;
  const fn = EVENTS[event];
  if (!fn) return;
  try {
    fn();
  } catch {
    // Never let a sound break the app.
  }
}

/* =============================================================
   File-based sounds

   The synthesized tones above are zero-asset. Sample-based sounds
   are used where a specific sound matters more than bundle size,
   e.g. the scanner sweep. Same mute toggle, same autoplay policy.
   ============================================================= */

const FILE_SOUNDS = {
  scanner: "/sounds/scanner.mp3",
};

// One audio element per sound so a rapid repeat doesn't restart the
// previous one — cloneNode on demand instead, and let the GC clean up.
const _fileCache = {};

function getAudio(name) {
  const src = FILE_SOUNDS[name];
  if (!src) return null;
  if (_fileCache[src]) return _fileCache[src].cloneNode();
  const el = new Audio(src);
  el.preload = "auto";
  _fileCache[src] = el;
  return el.cloneNode();
}

export function playFile(name, { loop = false, volume = 0.6 } = {}) {
  if (!isEnabled()) return null;
  const el = getAudio(name);
  if (!el) return null;
  el.loop = loop;
  el.volume = volume;
  try {
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {}
  return el;
}

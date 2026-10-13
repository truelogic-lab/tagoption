/** Global toast bus — components call `showToast()` from anywhere. */
const listeners = new Set();

export function onToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function showToast(payload) {
  listeners.forEach((fn) => {
    try { fn(payload); } catch {}
  });
}

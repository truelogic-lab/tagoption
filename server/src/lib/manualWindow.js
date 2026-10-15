/**
 * Manual trade window. A manual trade stays open for MANUAL_MS, then
 * the reaper settles it. Auto trades use their own runner and are
 * unaffected by this value.
 */
export const MANUAL_MS = 60_000;

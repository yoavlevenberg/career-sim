// Seedable, injectable RNG. Never call Math.random() in engine code —
// always thread a `rng` function created here through call sites so a
// career is fully reproducible from its seed.

// mulberry32 — small, fast, good-enough statistical quality for a game sim.
export function createRng(seed) {
  let state = seed >>> 0;

  function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  rng.getState = () => state >>> 0;
  return rng;
}

// Restore an RNG from a previously-saved state (see rng.getState()).
export function rngFromState(state) {
  return createRng(state);
}

export function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function randInt(rng, min, max) {
  return Math.floor(randRange(rng, min, max + 1));
}

export function chancePercent(rng, probabilityPercent) {
  return rng() * 100 < probabilityPercent;
}

export function pick(rng, arr) {
  return arr[randInt(rng, 0, arr.length - 1)];
}

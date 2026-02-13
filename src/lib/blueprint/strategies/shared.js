export function irStep(slot, key, text, op = "step") {
  return { slot, key, text, op };
}

export function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createPrng(seed = 0x9e3779b9) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createVerifierRandom(seed) {
  return createPrng(seed);
}

export function randInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

export function shuffle(random, items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randomWord(random, minLen = 0, maxLen = 6) {
  const alphabet = "abcde";
  const len = randInt(random, minLen, maxLen);
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += alphabet[randInt(random, 0, alphabet.length - 1)];
  }
  return out;
}

export function canonicalGroupOutput(groups) {
  const normalized = (groups || []).map((group) => [...group].sort());
  normalized.sort((a, b) => a.join("\u0001").localeCompare(b.join("\u0001")));
  return normalized;
}

export function canonicalTriplets(triplets) {
  const normalized = (triplets || []).map((triplet) => [...triplet].sort((a, b) => a - b));
  normalized.sort((a, b) => {
    for (let i = 0; i < 3; i += 1) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
  });
  return normalized;
}

export function sameNumberMembers(a, b) {
  const left = [...(a || [])].sort((x, y) => x - y);
  const right = [...(b || [])].sort((x, y) => x - y);
  return deepEqual(left, right);
}

export function solveSemanticProbe(input) {
  const left = Number(input?.left || 0);
  const right = Number(input?.right || 0);
  const text = String(input?.text || "");
  const chars = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    sum: left + right,
    mirrored: chars.split("").reverse().join(""),
    length: chars.length,
  };
}

export function semanticProbeOracle(input) {
  return solveSemanticProbe(input);
}

export function randomSemanticProbeCase(random) {
  return {
    left: randInt(random, -40, 40),
    right: randInt(random, -40, 40),
    text: randomWord(random, 0, 8),
  };
}

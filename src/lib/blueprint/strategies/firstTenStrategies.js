import { ARRAY_HASHING_TEMPLATE_ID, TWO_POINTERS_TEMPLATE_ID } from "../templates";
import {
  canonicalGroupOutput,
  canonicalTriplets,
  deepEqual,
  irStep,
  randInt,
  randomWord,
  sameNumberMembers,
  shuffle,
} from "./shared";

function twoSumOracle(input) {
  const nums = input?.nums || [];
  const target = Number(input?.target);
  for (let i = 0; i < nums.length; i += 1) {
    for (let j = i + 1; j < nums.length; j += 1) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return null;
}

function validTwoSumResult(input, got) {
  if (!Array.isArray(got) || got.length !== 2) return false;
  const [i, j] = got;
  const nums = input?.nums || [];
  if (!Number.isInteger(i) || !Number.isInteger(j)) return false;
  if (i < 0 || j < 0 || i >= nums.length || j >= nums.length || i === j) return false;
  return nums[i] + nums[j] === Number(input?.target);
}

function solveTwoSum(input) {
  const nums = input?.nums || [];
  const target = Number(input?.target);
  const indexByValue = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (indexByValue.has(need)) return [indexByValue.get(need), i];
    indexByValue.set(nums[i], i);
  }
  return [-1, -1];
}

function solveValidAnagram(input) {
  const s = String(input?.s || "");
  const t = String(input?.t || "");
  if (s.length !== t.length) return false;

  const freq = new Map();
  for (const ch of s) {
    freq.set(ch, (freq.get(ch) || 0) + 1);
  }
  for (const ch of t) {
    if (!freq.has(ch)) return false;
    const next = freq.get(ch) - 1;
    if (next < 0) return false;
    if (next === 0) freq.delete(ch);
    else freq.set(ch, next);
  }
  return freq.size === 0;
}

function validAnagramOracle(input) {
  const s = String(input?.s || "");
  const t = String(input?.t || "");
  return [...s].sort().join("") === [...t].sort().join("");
}

function solveContainsDuplicate(input) {
  const nums = input?.nums || [];
  const seen = new Set();
  for (const value of nums) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}

function containsDuplicateOracle(input) {
  const nums = input?.nums || [];
  return new Set(nums).size !== nums.length;
}

function signatureForAnagram(word) {
  const counts = new Array(26).fill(0);
  for (const ch of word) {
    const idx = ch.charCodeAt(0) - 97;
    if (idx >= 0 && idx < 26) counts[idx] += 1;
  }
  return counts.join("#");
}

function solveGroupAnagrams(input) {
  const strs = input?.strs || [];
  const groups = new Map();

  for (const word of strs) {
    const signature = signatureForAnagram(String(word));
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(String(word));
  }

  return Array.from(groups.values());
}

function groupAnagramsOracle(input) {
  const strs = input?.strs || [];
  const groups = new Map();
  for (const word of strs) {
    const key = [...String(word)].sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(String(word));
  }
  return Array.from(groups.values());
}

function solveTopKFrequent(input) {
  const nums = input?.nums || [];
  const k = Number(input?.k || 0);
  if (k <= 0) return [];

  const freq = new Map();
  for (const value of nums) {
    freq.set(value, (freq.get(value) || 0) + 1);
  }

  const buckets = new Array(nums.length + 1).fill(null).map(() => []);
  for (const [value, count] of freq.entries()) {
    buckets[count].push(value);
  }

  const out = [];
  for (let count = buckets.length - 1; count >= 0 && out.length < k; count -= 1) {
    for (const value of buckets[count]) {
      out.push(value);
      if (out.length === k) break;
    }
  }
  return out;
}

function topKOracle(input) {
  const nums = input?.nums || [];
  const k = Number(input?.k || 0);
  const freq = new Map();
  for (const value of nums) freq.set(value, (freq.get(value) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))
    .slice(0, k)
    .map((entry) => entry[0]);
}

function solveProductExceptSelf(input) {
  const nums = input?.nums || [];
  const out = new Array(nums.length).fill(1);

  let prefix = 1;
  for (let i = 0; i < nums.length; i += 1) {
    out[i] = prefix;
    prefix *= nums[i];
  }

  let suffix = 1;
  for (let i = nums.length - 1; i >= 0; i -= 1) {
    out[i] *= suffix;
    suffix *= nums[i];
  }
  return out;
}

function productExceptSelfOracle(input) {
  const nums = input?.nums || [];
  return nums.map((_, index) => {
    let product = 1;
    for (let i = 0; i < nums.length; i += 1) {
      if (i === index) continue;
      product *= nums[i];
    }
    return product;
  });
}

function encodeStrings(strs) {
  let out = "";
  for (const str of strs || []) {
    const value = String(str);
    out += `${value.length}#${value}`;
  }
  return out;
}

function decodeStrings(encoded) {
  const out = [];
  let i = 0;
  while (i < encoded.length) {
    let j = i;
    while (j < encoded.length && encoded[j] !== "#") j += 1;
    const len = Number(encoded.slice(i, j));
    const start = j + 1;
    const end = start + len;
    out.push(encoded.slice(start, end));
    i = end;
  }
  return out;
}

function solveEncodeDecode(input) {
  const strs = input?.strs || [];
  return decodeStrings(encodeStrings(strs));
}

function solveLongestConsecutive(input) {
  const nums = input?.nums || [];
  const seen = new Set(nums);
  let best = 0;

  for (const value of seen) {
    if (seen.has(value - 1)) continue;
    let length = 1;
    while (seen.has(value + length)) length += 1;
    if (length > best) best = length;
  }

  return best;
}

function longestConsecutiveOracle(input) {
  const nums = [...(input?.nums || [])];
  if (nums.length === 0) return 0;
  const unique = [...new Set(nums)].sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    if (unique[i] === unique[i - 1] + 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

function isAlphaNumeric(ch) {
  const code = ch.charCodeAt(0);
  const isDigit = code >= 48 && code <= 57;
  const isUpper = code >= 65 && code <= 90;
  const isLower = code >= 97 && code <= 122;
  return isDigit || isUpper || isLower;
}

function normalizedAlphaCodeAt(text, index) {
  const code = text.charCodeAt(index);
  const isDigit = code >= 48 && code <= 57;
  if (isDigit) return code;
  const isUpper = code >= 65 && code <= 90;
  if (isUpper) return code + 32;
  const isLower = code >= 97 && code <= 122;
  if (isLower) return code;
  return -1;
}

function solveValidPalindrome(input) {
  const text = String(input?.s || "");
  let left = 0;
  let right = text.length - 1;

  while (left < right) {
    let leftCode = normalizedAlphaCodeAt(text, left);
    while (left < right && leftCode < 0) {
      left += 1;
      leftCode = normalizedAlphaCodeAt(text, left);
    }

    let rightCode = normalizedAlphaCodeAt(text, right);
    while (left < right && rightCode < 0) {
      right -= 1;
      rightCode = normalizedAlphaCodeAt(text, right);
    }

    if (leftCode !== rightCode) return false;
    left += 1;
    right -= 1;
  }

  return true;
}

function validPalindromeOracle(input) {
  const clean = String(input?.s || "")
    .toLowerCase()
    .split("")
    .filter((ch) => isAlphaNumeric(ch))
    .join("");
  return clean === [...clean].reverse().join("");
}

function solveThreeSum(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  nums.sort((a, b) => a - b);
  const out = [];

  for (let i = 0; i < nums.length - 2; i += 1) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        out.push([nums[i], nums[left], nums[right]]);
        left += 1;
        right -= 1;
        while (left < right && nums[left] === nums[left - 1]) left += 1;
        while (left < right && nums[right] === nums[right + 1]) right -= 1;
      } else if (sum < 0) {
        left += 1;
      } else {
        right -= 1;
      }
    }
  }

  return out;
}

function threeSumOracle(input) {
  const nums = input?.nums || [];
  const found = new Set();
  const out = [];
  for (let i = 0; i < nums.length; i += 1) {
    for (let j = i + 1; j < nums.length; j += 1) {
      for (let k = j + 1; k < nums.length; k += 1) {
        if (nums[i] + nums[j] + nums[k] !== 0) continue;
        const triplet = [nums[i], nums[j], nums[k]].sort((a, b) => a - b);
        const key = triplet.join(",");
        if (found.has(key)) continue;
        found.add(key);
        out.push(triplet);
      }
    }
  }
  return out;
}

function randomTwoSumCase(random) {
  const length = randInt(random, 2, 9);
  const nums = [];
  for (let i = 0; i < length; i += 1) nums.push(randInt(random, -15, 15));
  return { nums, target: randInt(random, -20, 20) };
}

function randomValidAnagramCase(random) {
  const s = randomWord(random, 0, 8);
  const makeAnagram = random() < 0.5;
  if (makeAnagram) {
    return { s, t: shuffle(random, s.split("")).join("") };
  }
  if (s.length === 0) return { s, t: "z" };
  const tChars = shuffle(random, s.split(""));
  const idx = randInt(random, 0, tChars.length - 1);
  tChars[idx] = String.fromCharCode(97 + randInt(random, 0, 25));
  return { s, t: tChars.join("") };
}

function randomContainsDuplicateCase(random) {
  const length = randInt(random, 0, 12);
  const nums = [];
  for (let i = 0; i < length; i += 1) nums.push(randInt(random, -8, 8));
  return { nums };
}

function randomGroupAnagramsCase(random) {
  const total = randInt(random, 0, 10);
  const strs = [];
  for (let i = 0; i < total; i += 1) {
    if (random() < 0.35 && strs.length > 0) {
      const src = String(strs[randInt(random, 0, strs.length - 1)]);
      strs.push(shuffle(random, src.split("")).join(""));
      continue;
    }
    strs.push(randomWord(random, 0, 5));
  }
  return { strs };
}

function randomTopKCase(random) {
  const uniqueValues = randInt(random, 2, 6);
  const values = [];
  while (values.length < uniqueValues) {
    const value = randInt(random, -10, 10);
    if (!values.includes(value)) values.push(value);
  }
  let count = uniqueValues + randInt(random, 2, 6);
  const counts = [];
  for (let i = 0; i < uniqueValues; i += 1) {
    counts.push(Math.max(1, count));
    count -= randInt(random, 1, 2);
  }
  const nums = [];
  for (let i = 0; i < uniqueValues; i += 1) {
    for (let j = 0; j < counts[i]; j += 1) nums.push(values[i]);
  }
  return {
    nums: shuffle(random, nums),
    k: randInt(random, 1, uniqueValues),
  };
}

function randomProductCase(random) {
  const length = randInt(random, 2, 8);
  const nums = [];
  for (let i = 0; i < length; i += 1) nums.push(randInt(random, -4, 4));
  return { nums };
}

function randomEncodeCase(random) {
  const alphabet = "abc123#|/:_";
  const count = randInt(random, 0, 8);
  const strs = [];
  for (let i = 0; i < count; i += 1) {
    const len = randInt(random, 0, 8);
    let text = "";
    for (let j = 0; j < len; j += 1) text += alphabet[randInt(random, 0, alphabet.length - 1)];
    strs.push(text);
  }
  return { strs };
}

function randomLongestConsecutiveCase(random) {
  const length = randInt(random, 0, 14);
  const nums = [];
  for (let i = 0; i < length; i += 1) nums.push(randInt(random, -8, 12));
  return { nums };
}

function randomPalindromeCase(random) {
  const alphabet = "abCD09#@ !,._:;/-";
  const length = randInt(random, 0, 24);
  let s = "";
  for (let i = 0; i < length; i += 1) s += alphabet[randInt(random, 0, alphabet.length - 1)];
  return { s };
}

function randomThreeSumCase(random) {
  const length = randInt(random, 0, 10);
  const nums = [];
  for (let i = 0; i < length; i += 1) nums.push(randInt(random, -6, 6));
  return { nums };
}

export function createFirstTenStrategies() {
  return [
    {
      id: "two-sum-hash-map",
      name: "Two Sum Hash Map Strategy",
      appliesTo: (contract) => contract?.strategyId === "two-sum-hash-map",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Two Sum | Hash map lookup",
        ir: [
          irStep("setup", "init-index-map", "const indexByValue = new Map()", "declare"),
          irStep("loop", "for-i", "for (let i = 0; i < nums.length; i++)", "loop"),
          irStep("check", "need-target", "const need = target - nums[i]", "compute"),
          irStep("check", "found-match", "if (indexByValue.has(need)) return [indexByValue.get(need), i]", "branch"),
          irStep("update", "save-index", "indexByValue.set(nums[i], i)", "update"),
          irStep("return", "ret-not-found", "return [-1, -1]", "return"),
        ],
        solve: solveTwoSum,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomTwoSumCase,
        randomOracle: twoSumOracle,
        assertCase: ({ got, expected, input, mode }) => {
          if (mode === "random") {
            const oracle = expected;
            if (oracle === null) return deepEqual(got, [-1, -1]);
            return validTwoSumResult(input, got);
          }
          return deepEqual(got, expected);
        },
      }),
    },
    {
      id: "valid-anagram-frequency",
      name: "Valid Anagram Frequency Strategy",
      appliesTo: (contract) => contract?.strategyId === "valid-anagram-frequency",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Valid Anagram | Frequency map",
        ir: [
          irStep("check", "len-check", "if (s.length !== t.length) return false", "branch"),
          irStep("setup", "init-freq", "const freq = new Map()", "declare"),
          irStep("loop", "for-s", "for (const ch of s)", "loop"),
          irStep("update", "inc-freq", "freq.set(ch, (freq.get(ch) || 0) + 1)", "update"),
          irStep("loop", "for-t", "for (const ch of t)", "loop"),
          irStep("check", "missing-char", "if (!freq.has(ch)) return false", "branch"),
          irStep(
            "update",
            "dec-freq",
            "const next = (freq.get(ch) || 0) - 1; if (next < 0) return false; if (next === 0) freq.delete(ch); else freq.set(ch, next)",
            "update"
          ),
          irStep("return", "ret-empty", "return freq.size === 0", "return"),
        ],
        solve: solveValidAnagram,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomValidAnagramCase,
        randomOracle: validAnagramOracle,
      }),
    },
    {
      id: "contains-duplicate-set",
      name: "Contains Duplicate Set Strategy",
      appliesTo: (contract) => contract?.strategyId === "contains-duplicate-set",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Contains Duplicate | Hash set",
        ir: [
          irStep("setup", "init-seen", "const seen = new Set()", "declare"),
          irStep("loop", "for-num", "for (const value of nums)", "loop"),
          irStep("check", "seen-before", "if (seen.has(value)) return true", "branch"),
          irStep("update", "add-seen", "seen.add(value)", "update"),
          irStep("return", "ret-false", "return false", "return"),
        ],
        solve: solveContainsDuplicate,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomContainsDuplicateCase,
        randomOracle: containsDuplicateOracle,
      }),
    },
    {
      id: "group-anagrams-signature",
      name: "Group Anagrams Signature Strategy",
      appliesTo: (contract) => contract?.strategyId === "group-anagrams-signature",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Group Anagrams | Signature hash map",
        ir: [
          irStep("setup", "init-groups", "const groups = new Map()", "declare"),
          irStep("loop", "for-word", "for (const word of strs)", "loop"),
          irStep(
            "check",
            "build-signature",
            "const counts = Array(26).fill(0); for (const ch of word) counts[ch.charCodeAt(0) - 97] += 1; const signatureKey = counts.join('#')",
            "compute"
          ),
          irStep("check", "create-group", "if (!groups.has(signatureKey)) groups.set(signatureKey, [])", "branch"),
          irStep("update", "push-group", "groups.get(signatureKey).push(word)", "update"),
          irStep("return", "ret-groups", "return Array.from(groups.values())", "return"),
        ],
        solve: solveGroupAnagrams,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomGroupAnagramsCase,
        randomOracle: groupAnagramsOracle,
        normalizeResult: canonicalGroupOutput,
      }),
    },
    {
      id: "top-k-frequent-bucket",
      name: "Top K Frequent Bucket Strategy",
      appliesTo: (contract) => contract?.strategyId === "top-k-frequent-bucket",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Top K Frequent | Bucket walk",
        ir: [
          irStep("setup", "init-freq", "const freq = new Map()", "declare"),
          irStep("loop", "for-num", "for (const value of nums)", "loop"),
          irStep("update", "count-num", "freq.set(value, (freq.get(value) || 0) + 1)", "update"),
          irStep("setup", "init-buckets", "const buckets = Array(nums.length + 1).fill([])", "declare"),
          irStep("loop", "for-freq", "for (const [value, count] of freq)", "loop"),
          irStep("update", "push-bucket", "buckets[count].push(value)", "update"),
          irStep("loop", "walk-buckets", "for (let c = buckets.length - 1; c >= 0 && out.length < k; c--)", "loop"),
          irStep("update", "collect-topk", "for (const value of buckets[c]) { out.push(value); if (out.length === k) break }", "update"),
          irStep("return", "ret-topk", "return out", "return"),
        ],
        solve: solveTopKFrequent,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomTopKCase,
        randomOracle: topKOracle,
        assertCase: ({ got, expected }) => Array.isArray(got) && sameNumberMembers(got, expected),
      }),
    },
    {
      id: "product-except-self-prefix-suffix",
      name: "Product Except Self Prefix/Suffix Strategy",
      appliesTo: (contract) => contract?.strategyId === "product-except-self-prefix-suffix",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Product Except Self | Prefix + suffix",
        ir: [
          irStep("setup", "init-out", "const out = Array(nums.length).fill(1)", "declare"),
          irStep("setup", "init-prefix", "let prefix = 1", "declare"),
          irStep("loop", "for-prefix", "for (let i = 0; i < nums.length; i++)", "loop"),
          irStep("update", "write-prefix", "out[i] = prefix", "update"),
          irStep("update", "advance-prefix", "prefix *= nums[i]", "update"),
          irStep("setup", "init-suffix", "let suffix = 1", "declare"),
          irStep("loop", "for-suffix", "for (let i = nums.length - 1; i >= 0; i--)", "loop"),
          irStep("update", "apply-suffix", "out[i] *= suffix", "update"),
          irStep("update", "advance-suffix", "suffix *= nums[i]", "update"),
          irStep("return", "ret-out", "return out", "return"),
        ],
        solve: solveProductExceptSelf,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomProductCase,
        randomOracle: productExceptSelfOracle,
      }),
    },
    {
      id: "encode-decode-length-prefix",
      name: "Encode Decode Length Prefix Strategy",
      appliesTo: (contract) => contract?.strategyId === "encode-decode-length-prefix",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Encode/Decode | Length-prefix protocol",
        ir: [
          irStep("setup", "init-encoded", "let encoded = ''", "declare"),
          irStep("loop", "for-encode", "for (const str of strs)", "loop"),
          irStep("update", "append-token", "encoded += `${str.length}#${str}`", "update"),
          irStep("setup", "init-decoded", "const decoded = []", "declare"),
          irStep("setup", "init-ptr", "let i = 0", "declare"),
          irStep("loop", "while-parse", "while (i < encoded.length)", "loop"),
          irStep(
            "update",
            "read-len",
            "let j = i; while (encoded[j] !== '#') j++; const len = Number(encoded.slice(i, j)); const start = j + 1; const end = start + len",
            "update"
          ),
          irStep("update", "slice-body", "decoded.push(encoded.slice(start, end)); i = end", "update"),
          irStep("return", "ret-decoded", "return decoded", "return"),
        ],
        solve: solveEncodeDecode,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomEncodeCase,
        randomOracle: (input) => input?.strs || [],
      }),
    },
    {
      id: "longest-consecutive-set",
      name: "Longest Consecutive Set Strategy",
      appliesTo: (contract) => contract?.strategyId === "longest-consecutive-set",
      buildPlan: (contract) => ({
        templateId: ARRAY_HASHING_TEMPLATE_ID,
        snippetName: "Longest Consecutive | Sequence starts",
        ir: [
          irStep("setup", "init-seen", "const seen = new Set(nums)", "declare"),
          irStep("setup", "init-best", "let best = 0", "declare"),
          irStep("loop", "for-value", "for (const value of seen)", "loop"),
          irStep("check", "is-start", "if (seen.has(value - 1)) continue", "branch"),
          irStep("update", "reset-run", "let length = 1", "update"),
          irStep("loop", "while-run", "while (seen.has(value + length)) length++", "loop"),
          irStep("update", "update-best", "best = Math.max(best, length)", "update"),
          irStep("return", "ret-best", "return best", "return"),
        ],
        solve: solveLongestConsecutive,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomLongestConsecutiveCase,
        randomOracle: longestConsecutiveOracle,
      }),
    },
    {
      id: "valid-palindrome-two-pointers",
      name: "Valid Palindrome Two Pointers Strategy",
      appliesTo: (contract) => contract?.strategyId === "valid-palindrome-two-pointers",
      buildPlan: (contract) => ({
        templateId: TWO_POINTERS_TEMPLATE_ID,
        snippetName: "Valid Palindrome | Two pointers",
        ir: [
          irStep("setup", "normalize", "const text = s.toLowerCase()", "declare"),
          irStep("setup", "init-left", "let left = 0", "declare"),
          irStep("setup", "init-right", "let right = text.length - 1", "declare"),
          irStep("loop", "while-lt", "while (left < right)", "loop"),
          irStep("check", "skip-left", "while (left < right && !isAlphaNum(text[left])) left++", "branch"),
          irStep("check", "skip-right", "while (left < right && !isAlphaNum(text[right])) right--", "branch"),
          irStep("check", "char-mismatch", "if (text[left] !== text[right]) return false", "branch"),
          irStep("update", "move-pointers", "left++; right--", "update"),
          irStep("return", "ret-true", "return true", "return"),
        ],
        solve: solveValidPalindrome,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomPalindromeCase,
        randomOracle: validPalindromeOracle,
      }),
    },
    {
      id: "three-sum-two-pointers",
      name: "3Sum Sorted Two Pointers Strategy",
      appliesTo: (contract) => contract?.strategyId === "three-sum-two-pointers",
      buildPlan: (contract) => ({
        templateId: TWO_POINTERS_TEMPLATE_ID,
        snippetName: "3Sum | Sort + two pointers",
        ir: [
          irStep("setup", "sort-input", "nums.sort((a, b) => a - b)", "declare"),
          irStep("setup", "init-out", "const out = []", "declare"),
          irStep("loop", "for-i", "for (let i = 0; i < nums.length - 2; i++)", "loop"),
          irStep("check", "skip-dup-i", "if (i > 0 && nums[i] === nums[i - 1]) continue", "branch"),
          irStep("setup", "init-lr", "let left = i + 1; let right = nums.length - 1", "declare"),
          irStep("loop", "while-lr", "while (left < right)", "loop"),
          irStep("update", "calc-sum", "const sum = nums[i] + nums[left] + nums[right]", "compute"),
          irStep(
            "check",
            "sum-zero",
            "if (sum === 0) { out.push([nums[i], nums[left], nums[right]]); left += 1; right -= 1; while (left < right && nums[left] === nums[left - 1]) left++; while (left < right && nums[right] === nums[right + 1]) right-- }",
            "branch"
          ),
          irStep("check", "sum-neg", "else if (sum < 0) left++", "branch"),
          irStep("check", "sum-pos", "else right--", "branch"),
          irStep("return", "ret-out", "return out", "return"),
        ],
        solve: solveThreeSum,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomThreeSumCase,
        randomOracle: threeSumOracle,
        normalizeResult: canonicalTriplets,
      }),
    },
  ];
}

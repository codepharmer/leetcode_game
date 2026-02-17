const JS_MARKERS = [
  /\bfunction\b/,
  /\bconst\b/,
  /\blet\b/,
  /\bvar\b/,
  /=>/,
  /\bnew\s+Map\s*\(/,
  /\bnew\s+Set\s*\(/,
  /\bArray\b/,
  /\bArray\.isArray\s*\(/,
  /\bNumber\s*\(/,
  /\bString\s*\(/,
  /===/,
  /!==/,
  /&&/,
  /\|\|/,
  /\+\+/,
  /--/,
  /\btrue\b/,
  /\bfalse\b/,
  /\bnull\b/,
  /\.set\s*\(/,
  /\.has\s*\(/,
  /\.size\b/,
  /\.push\s*\(/,
  /\.shift\s*\(/,
  /\.sort\s*\(/,
  /\.flatMap\s*\(/,
  /\bMath\./,
  /\.toLowerCase\s*\(/,
  /\.length\b/,
  /\bfor\s*\(/,
  /\bwhile\s*\(/,
  /\bif\s*\(/,
  /;\s*(?:$|\n)/,
  /[{}]/,
];

function normalizeInterpolationExpression(text) {
  let out = String(text || "").trim();
  out = out.replace(/===/g, "==");
  out = out.replace(/!==/g, "!=");
  out = out.replace(/\s&&\s/g, " and ");
  out = out.replace(/\s\|\|\s/g, " or ");
  out = out.replace(/!\s*(?!=)/g, "not ");
  out = out.replace(/\bnew\s+Map\s*\(\s*\)/g, "{}");
  out = out.replace(/\bnew\s+Set\s*\(\s*\)/g, "set()");
  out = out.replace(/\bMath\.max\b/g, "max");
  out = out.replace(/\bMath\.min\b/g, "min");
  out = out.replace(/\bconst\s+/g, "");
  out = out.replace(/\blet\s+/g, "");
  out = out.replace(/\bvar\s+/g, "");
  out = replaceLengthAccess(out);
  return out;
}

function maskTemplateLiterals(source) {
  const templates = [];
  const masked = String(source || "").replace(/`([^`]*)`/g, (_match, body) => {
    const convertedBody = String(body || "").replace(/\$\{([^}]+)\}/g, (_inner, expr) => {
      return `{${normalizeInterpolationExpression(expr)}}`;
    });
    const safeBody = convertedBody.replace(/"/g, '\\"');
    const token = `__TPL_${templates.length}__`;
    templates.push({ token, value: `f"${safeBody}"` });
    return token;
  });
  return { masked, templates };
}

function unmaskTemplateLiterals(source, templates) {
  let out = String(source || "");
  for (const entry of templates || []) {
    if (!entry?.token) continue;
    out = out.replace(new RegExp(entry.token, "g"), entry.value || "");
  }
  return out;
}

function looksBalancedParentheses(text) {
  let depth = 0;
  for (const ch of String(text || "")) {
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function stripOuterParens(text) {
  let out = String(text || "").trim();
  while (out.startsWith("(") && out.endsWith(")") && looksBalancedParentheses(out.slice(1, -1))) {
    out = out.slice(1, -1).trim();
  }
  return out;
}

function replaceLengthAccess(text) {
  return String(text || "").replace(
    /\b([A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]+\]|\.[A-Za-z_][A-Za-z0-9_]*)*)\.length\b/g,
    "len($1)"
  );
}

function splitSemicolonsOutsideParens(text) {
  const source = String(text || "");
  let out = "";
  let parenDepth = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (const ch of source) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if ((inSingle || inDouble) && ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }

    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (!inSingle && ch === "\"") {
      inDouble = !inDouble;
      out += ch;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === "(") parenDepth += 1;
      if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
      if (ch === ";" && parenDepth === 0) {
        out += ";\n";
        continue;
      }
    }

    out += ch;
  }

  return out;
}

function replaceCommonSyntax(text) {
  let out = String(text || "");

  out = out.replace(/===/g, "==");
  out = out.replace(/!==/g, "!=");
  out = out.replace(/\s*&&\s*/g, " and ");
  out = out.replace(/\s*\|\|\s*/g, " or ");
  out = out.replace(/!\s*(?!=)/g, "not ");

  out = out.replace(/\btrue\b/g, "True");
  out = out.replace(/\bfalse\b/g, "False");
  out = out.replace(/\bnull\b/g, "None");

  out = out.replace(/\?\./g, ".");
  out = out.replace(
    /\bArray\.isArray\s*\(([^)]+)\)\s*\?\s*([^:;]+?)\s*:\s*([^;]+)/g,
    "$2 if isinstance($1, list) else $3"
  );
  out = out.replace(/\bArray\.isArray\s*\(([^)]+)\)/g, "isinstance($1, list)");
  out = out.replace(/\bnew\s+Map\s*\(\s*\)/g, "{}");
  out = out.replace(/\bnew\s+Set\s*\(\s*\)/g, "set()");
  out = out.replace(/\bnew\s+Set\s*\(([^)]*)\)/g, "set($1)");
  out = out.replace(/\bArray\s*\(([^)]+)\)\.fill\(\s*\[\s*\]\s*\)/g, "[[] for _ in range($1)]");
  out = out.replace(/\bArray\s*\(([^)]+)\)\.fill\(\s*([^)]+)\s*\)/g, "[$2] * ($1)");
  out = out.replace(/\bArray\.from\((.+)\)/g, "list($1)");
  out = out.replace(
    /\b([A-Za-z_][A-Za-z0-9_]*)\.sort\s*\(\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*=>\s*\2\s*\.\s*length\s*-\s*\3\s*\.\s*length\s*or\s*JSON\.stringify\(\2\)\.localeCompare\(JSON\.stringify\(\3\)\)\s*\)/g,
    "sorted($1, key=lambda x: (len(x), str(x)))"
  );
  out = out.replace(
    /\b([A-Za-z_][A-Za-z0-9_]*)\.sort\s*\(\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*=>\s*\2\s*-\s*\3\s*\)/g,
    "$1.sort()"
  );
  out = out.replace(
    /\b([A-Za-z_][A-Za-z0-9_]*)\.sort\s*\(\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*=>\s*\3\s*-\s*\2\s*\)/g,
    "$1.sort(reverse=True)"
  );
  out = out.replace(/\.toLowerCase\s*\(\s*\)/g, ".lower()");
  out = out.replace(/\bNumber\s*\(([^)]+)\)/g, "int($1)");
  out = out.replace(/\bString\s*\(([^)]+)\)/g, "str($1)");
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.charCodeAt\(\s*0\s*\)/g, "ord($1)");
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.slice\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, "$1[$2:$3]");
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.join\(\s*(['\"][^'\"]*['\"])\s*\)/g, "$2.join($1)");
  out = out.replace(/\bMath\.max\b/g, "max");
  out = out.replace(/\bMath\.min\b/g, "min");
  out = out.replace(/\bMath\.floor\s*\(([^)]+)\)/g, "int($1)");
  out = out.replace(/\.push\s*\(/g, ".append(");
  out = out.replace(/\.shift\s*\(\s*\)/g, ".pop(0)");
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.size\b/g, "len($1)");
  out = out.replace(
    /\b([A-Za-z_][A-Za-z0-9_]*)\.flatMap\s*\(\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*=>\s*\(\s*\2 if isinstance\(\2,\s*list\)\s*else\s*\[\]\s*\)\s*\)/g,
    "[__flat for $2 in $1 for __flat in ($2 if isinstance($2, list) else [])]"
  );
  out = out.replace(
    /(\[[^\n]+?\])\.sort\s*\(\s*\(\s*[A-Za-z_][A-Za-z0-9_]*\s*,\s*[A-Za-z_][A-Za-z0-9_]*\s*\)\s*=>\s*[A-Za-z_][A-Za-z0-9_]*\s*-\s*[A-Za-z_][A-Za-z0-9_]*\s*\)/g,
    "sorted($1)"
  );
  out = out.replace(/^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*$/gm, "def $1($2):");

  out = out.replace(/\bconst\s+/g, "");
  out = out.replace(/\blet\s+/g, "");
  out = out.replace(/\bvar\s+/g, "");

  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\+\+/g, "$1 += 1");
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*--/g, "$1 -= 1");

  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.has\(([^)]+)\)/g, "$2 in $1");
  out = out.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.delete\(([^)]+)\)/g, "$1.pop($2, None)");
  out = out.replace(/^([A-Za-z_][A-Za-z0-9_]*)\.set\(([^,]+),\s*(.+)\)$/g, "$1[$2] = $3");

  out = replaceLengthAccess(out);
  return out;
}

function normalizeCondition(text) {
  return replaceCommonSyntax(stripOuterParens(text)).trim();
}

function normalizeStatement(text) {
  return replaceCommonSyntax(String(text || "").trim().replace(/;$/, ""));
}

function formatRange(start, stop, step) {
  const s = String(start || "").trim();
  const e = String(stop || "").trim();
  if (String(step) === "1") return `range(${s}, ${e})`;
  return `range(${s}, ${e}, ${step})`;
}

function parseForHeader(header) {
  const raw = String(header || "").trim();

  const forOfPairMatch = raw.match(/^(?:const|let|var)?\s*\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s+of\s+(.+)$/);
  if (forOfPairMatch) {
    const left = forOfPairMatch[1];
    const right = forOfPairMatch[2];
    let iterable = normalizeStatement(forOfPairMatch[3]);
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(iterable)) {
      iterable = `${iterable}.items()`;
    }
    return `for ${left}, ${right} in ${iterable}:`;
  }

  const forOfMatch = raw.match(/^(?:const|let|var)?\s*([A-Za-z_][A-Za-z0-9_]*)\s+of\s+(.+)$/);
  if (forOfMatch) {
    const variable = forOfMatch[1];
    const iterable = normalizeStatement(forOfMatch[2]);
    return `for ${variable} in ${iterable}:`;
  }

  const segments = raw.split(";").map((part) => part.trim());
  if (segments.length !== 3) return null;

  const condPrimary = segments[1].split("&&")[0].trim();

  const initMatch = segments[0].match(/^(?:const|let|var)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  const condMatch = condPrimary.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*([<>]=?)\s*(.+)$/);
  const stepMatch = segments[2].match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(\+\+|--|\+=\s*[-]?\d+|-=\s*[-]?\d+)$/);
  if (!initMatch || !condMatch || !stepMatch) return null;

  const variable = initMatch[1];
  const condVariable = condMatch[1];
  const stepVariable = stepMatch[1];
  if (variable !== condVariable || variable !== stepVariable) return null;

  const start = normalizeStatement(initMatch[2]);
  const op = condMatch[2];
  const end = normalizeStatement(condMatch[3]);
  const stepToken = stepMatch[2].replace(/\s+/g, "");

  let step = null;
  if (stepToken === "++") step = 1;
  else if (stepToken === "--") step = -1;
  else if (stepToken.startsWith("+=")) step = Number(stepToken.slice(2));
  else if (stepToken.startsWith("-=")) step = -Number(stepToken.slice(2));
  if (!Number.isFinite(step) || step === 0) return null;

  if (step > 0 && (op === "<" || op === "<=")) {
    const stop = op === "<" ? end : `(${end}) + 1`;
    return `for ${variable} in ${formatRange(start, stop, String(step))}:`;
  }
  if (step < 0 && (op === ">" || op === ">=")) {
    const stop = op === ">" ? end : `(${end}) - 1`;
    return `for ${variable} in ${formatRange(start, stop, String(step))}:`;
  }

  return null;
}

function splitKeywordParenLine(source, keyword) {
  const raw = String(source || "").trim();
  const kw = String(keyword || "");
  if (!kw) return null;
  if (!raw.startsWith(kw)) return null;

  let cursor = kw.length;
  while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1;
  if (raw[cursor] !== "(") return null;

  const start = cursor;
  let depth = 0;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === "(") depth += 1;
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return {
          header: raw.slice(start + 1, i).trim(),
          tail: raw.slice(i + 1).trim(),
        };
      }
    }
  }

  return null;
}

function convertControlLine(line) {
  const source = String(line || "").trim();
  if (!source) return "";

  const forLine = splitKeywordParenLine(source, "for");
  if (forLine) {
    const header = parseForHeader(forLine.header);
    if (header && forLine.tail) return `${header} ${normalizeStatement(forLine.tail)}`;
    if (header) return header;
  }

  const whileLine = splitKeywordParenLine(source, "while");
  if (whileLine && whileLine.tail) return `while ${normalizeCondition(whileLine.header)}: ${normalizeStatement(whileLine.tail)}`;
  if (whileLine) return `while ${normalizeCondition(whileLine.header)}:`;

  const elifLine = splitKeywordParenLine(source, "else if");
  if (elifLine && elifLine.tail) return `elif ${normalizeCondition(elifLine.header)}: ${normalizeStatement(elifLine.tail)}`;
  if (elifLine) return `elif ${normalizeCondition(elifLine.header)}:`;

  const ifLine = splitKeywordParenLine(source, "if");
  if (ifLine && ifLine.tail) return `if ${normalizeCondition(ifLine.header)}: ${normalizeStatement(ifLine.tail)}`;
  if (ifLine) return `if ${normalizeCondition(ifLine.header)}:`;

  const elseInline = source.match(/^else\s+(.+)$/);
  if (elseInline) return `else: ${normalizeStatement(elseInline[1])}`;

  if (source === "else") return "else:";

  return normalizeStatement(source);
}

export function looksJavaScriptLikeCardText(text) {
  const source = String(text || "").trim();
  if (!source) return false;
  return JS_MARKERS.some((pattern) => pattern.test(source));
}

export function pythonizeCardText(text) {
  const source = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!source) return "";
  if (!looksJavaScriptLikeCardText(source)) return source;

  const { masked, templates } = maskTemplateLiterals(source);

  const expanded = masked
    .replace(/}\s*else\s+if/g, "}\nelse if")
    .replace(/}\s*else/g, "}\nelse")
    .replace(/\{/g, "{\n")
    .replace(/\}/g, "\n}\n");

  const semicolonExpanded = splitSemicolonsOutsideParens(expanded);

  const rawLines = semicolonExpanded
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const out = [];
  let indent = 0;

  for (let rawLine of rawLines) {
    if (rawLine === "}") {
      indent = Math.max(0, indent - 1);
      continue;
    }

    while (rawLine.startsWith("}")) {
      indent = Math.max(0, indent - 1);
      rawLine = rawLine.slice(1).trim();
    }
    if (!rawLine) continue;

    let opensBlock = false;
    if (rawLine.endsWith("{")) {
      opensBlock = true;
      rawLine = rawLine.slice(0, -1).trim();
    }

    const converted = convertControlLine(rawLine);
    if (!converted) continue;

    out.push(`${"  ".repeat(indent)}${converted}`);
    if (opensBlock) indent += 1;
  }

  const pythonized = out.join("\n").trim();
  return unmaskTemplateLiterals(pythonized, templates);
}

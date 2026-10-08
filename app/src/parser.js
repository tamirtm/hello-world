// Extracts `TFC|<json>` snapshot lines from game log text.
export function parseLine(line) {
  const i = line.indexOf('TFC|');
  if (i === -1) return null;
  try {
    const obj = JSON.parse(line.slice(i + 4));
    return obj && typeof obj === 'object' ? obj : null;
  } catch {
    return null;
  }
}

export function parseChunk(text) {
  return text.split(/\r?\n/).map(parseLine).filter(Boolean);
}

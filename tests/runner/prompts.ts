export type Prompt = {
  index: number;
  title: string;
  body: string;
  slug: string;
};

export function parsePrompts(content: string): Prompt[] {
  const lines = content.split('\n');
  const sections: { index: number; title: string; body: string[] }[] = [];
  let current: { index: number; title: string; body: string[] } | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      if (current) sections.push(current);
      const numbered = h2[1].match(/^(\d+)\.\s+(.+?)(?:\s+\(.*\))?\s*$/);
      current = numbered
        ? { index: Number(numbered[1]), title: numbered[2].trim(), body: [] }
        : null;
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) sections.push(current);

  return sections
    .map(s => {
      const body = extractFirstBlockquote(s.body);
      if (!body) return null;
      const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return { index: s.index, title: s.title, body, slug };
    })
    .filter((p): p is Prompt => p !== null);
}

function extractFirstBlockquote(lines: string[]): string | null {
  const collected: string[] = [];
  let started = false;
  for (const line of lines) {
    if (line.startsWith('>')) {
      started = true;
      collected.push(line.replace(/^>\s?/, ''));
    } else if (started) {
      if (line.trim() === '') {
        collected.push('');
        continue;
      }
      break;
    }
  }
  if (!started) return null;
  while (collected.length > 0 && collected[collected.length - 1].trim() === '') collected.pop();
  return collected.join('\n').trim();
}

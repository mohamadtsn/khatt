const TASK_LINE = /^(\s*[-*+]\s+\[)([ xX])(\])/;
const FENCE = /^\s*(?:```|~~~)/;

/* Rewrites a single character rather than re-serializing the document: a full
   HTML -> markdown round trip to flip one box would reformat everything around
   it. A checkbox inside a code fence is sample text, not a task. */
export function toggleTask(markdown: string, index: number, checked: boolean): string {
  const lines = markdown.split('\n');
  let inFence = false;
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!TASK_LINE.test(line)) continue;
    if (seen++ !== index) continue;
    lines[i] = line.replace(TASK_LINE, `$1${checked ? 'x' : ' '}$3`);
    return lines.join('\n');
  }
  return markdown;
}

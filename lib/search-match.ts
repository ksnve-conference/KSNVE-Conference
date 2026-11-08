/**
 * Search that ignores spacing: Korean terms are written both ways ("능동소음제어" /
 * "능동 소음 제어"), so spaces are dropped from both the query and the record
 * before the substring match. Either spelling gives the same results.
 */
const SEP = '\u0001'; // joins fields without letting a match run across two of them
const squash = (s: string) => s.toLocaleLowerCase('ko').replace(/\s+/g, '');

export function searchMatcher(query: string) {
  const q = squash(query);
  return (fields: (string | null | undefined)[]) => !q || squash(fields.filter(Boolean).join(SEP)).includes(q);
}

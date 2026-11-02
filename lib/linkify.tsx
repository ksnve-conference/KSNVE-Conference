const URL_RE = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)'\]])/g;

/** Turns http(s) addresses in a notice body into links that open in a new tab.
 * Taps on a link don't reach the surrounding card, so it doesn't toggle or collapse. */
export function linkify(text: string) {
  return text.split(URL_RE).map((part, i) => (i % 2 === 1
    ? <a key={i} className="notice-link" href={part} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{part}</a>
    : part));
}

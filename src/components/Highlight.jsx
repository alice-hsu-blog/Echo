// Renders `text` with any case-insensitive occurrence of `term` wrapped in
// <mark>, via React elements (no dangerouslySetInnerHTML needed since JSX
// already escapes text content).
export default function Highlight({ text, term }) {
  const str = String(text ?? '');
  if (!term) return str;

  let re;
  try {
    const escTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(`(${escTerm})`, 'gi');
  } catch (e) {
    return str;
  }

  const parts = str.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? <mark key={i}>{part}</mark> : part
  );
}

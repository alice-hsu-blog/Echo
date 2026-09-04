// Keyboard-shortcut model shared by the global keydown handler in App.jsx
// and the "快捷鍵"/"Keyboard Shortcuts" dialog (see ShortcutsDialog.jsx,
// useShortcuts.js). A binding is stored as a canonical string like "mod+f",
// "mod+[", "+" — lowercase, modifiers first in a fixed order (mod, shift,
// alt), joined by "+". "mod" means ⌘ on macOS and Ctrl elsewhere, matched
// as `e.metaKey || e.ctrlKey` to mirror the app's original hardcoded checks.

export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');

// The shortcuts the user can see and (when `editable`) rebind. `action` is
// looked up by App.jsx; `labelKey`/`descKey` are translation keys. Order here
// is the display order in the dialog. Non-editable rows are shown for
// reference only — their behaviour stays hardcoded in App.jsx because it's
// context-dependent (Escape) or intentionally fixed (bulk delete).
export const SHORTCUT_DEFS = [
  {
    id: 'addQuote',
    editable: true,
    allowInInput: false,
    default: '+',
    labelKey: 'shortcuts.addQuote',
    descKey: 'shortcuts.addQuoteDesc'
  },
  {
    id: 'focusSearch',
    editable: true,
    allowInInput: true,
    default: 'mod+f',
    labelKey: 'shortcuts.focusSearch',
    descKey: 'shortcuts.focusSearchDesc'
  },
  {
    id: 'goBack',
    editable: true,
    allowInInput: true,
    default: 'mod+[',
    labelKey: 'shortcuts.goBack',
    descKey: 'shortcuts.goBackDesc'
  },
  {
    id: 'escape',
    editable: false,
    default: 'Escape',
    labelKey: 'shortcuts.escape',
    descKey: 'shortcuts.escapeDesc'
  },
  {
    id: 'deleteSelected',
    editable: false,
    default: 'Backspace',
    labelKey: 'shortcuts.deleteSelected',
    descKey: 'shortcuts.deleteSelectedDesc'
  }
];

export const EDITABLE_SHORTCUT_IDS = SHORTCUT_DEFS.filter((d) => d.editable).map((d) => d.id);

export const DEFAULT_BINDINGS = Object.fromEntries(SHORTCUT_DEFS.map((d) => [d.id, d.default]));

const MOD_ORDER = ['mod', 'shift', 'alt'];

// A "normal" printable key or a small set of named keys we allow as the base
// of a shortcut. Rebinding to a bare modifier or to Tab/Enter is rejected.
function isAllowedBaseKey(key) {
  if (!key) return false;
  if (key.length === 1) return key !== ' ';
  return ['Escape', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
}

export function parseBinding(str) {
  const parts = String(str).split('+');
  // A trailing "+" means the base key is literally "+", which split() turns
  // into a trailing empty segment.
  let base = parts.pop();
  if (base === '') base = '+';
  const mods = new Set(parts);
  return {
    key: base,
    mod: mods.has('mod'),
    shift: mods.has('shift'),
    alt: mods.has('alt')
  };
}

// Build a canonical binding string from a KeyboardEvent, or return null if the
// event isn't a usable shortcut (bare modifier, disallowed base key, etc.).
export function eventToBinding(e) {
  const key = e.key;
  if (['Control', 'Meta', 'Shift', 'Alt', 'CapsLock', 'Dead'].includes(key)) return null;
  const mod = e.metaKey || e.ctrlKey;
  // Normalise: "Add" is the numpad plus; shift+"=" yields "+" already.
  let base = key === 'Add' ? '+' : key;
  if (base.length === 1) base = base.toLowerCase();
  if (!isAllowedBaseKey(base)) return null;
  // Ignore the shift that was only needed to type the base char (e.g. "+"),
  // but keep it when it's a real extra modifier on a letter/named key.
  const shiftIsMeaningful = e.shiftKey && (base.length > 1 || /[a-z]/.test(base));
  const out = [];
  if (mod) out.push('mod');
  if (shiftIsMeaningful) out.push('shift');
  if (e.altKey) out.push('alt');
  out.sort((a, b) => MOD_ORDER.indexOf(a) - MOD_ORDER.indexOf(b));
  return [...out, base].join('+');
}

export function matchesBinding(e, str) {
  if (!str) return false;
  const b = parseBinding(str);
  const mod = e.metaKey || e.ctrlKey;
  if (b.mod !== mod) return false;
  if (b.alt !== e.altKey) return false;

  const evtKey = e.key === 'Add' ? '+' : e.key;
  // "+" is commonly typed as shift+"="; accept either spelling.
  if (b.key === '+') {
    if (evtKey !== '+' && !(e.key === '=' && e.shiftKey)) return false;
  } else if (b.key.length === 1) {
    if (evtKey.toLowerCase() !== b.key) return false;
    if (b.shift !== e.shiftKey) return false;
  } else {
    if (evtKey !== b.key) return false;
    if (b.shift !== e.shiftKey) return false;
  }
  return true;
}

const KEY_DISPLAY = {
  Escape: 'Esc',
  Backspace: isMac ? '⌫' : 'Backspace',
  Delete: isMac ? '⌦' : 'Delete',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ' ': 'Space'
};

// Human-readable form for the dialog, e.g. "⌘F" / "Ctrl+F", "+", "Esc".
export function formatBinding(str) {
  const b = parseBinding(str);
  const keyLabel = KEY_DISPLAY[b.key] || (b.key.length === 1 ? b.key.toUpperCase() : b.key);
  if (isMac) {
    return (b.mod ? '⌘' : '') + (b.alt ? '⌥' : '') + (b.shift ? '⇧' : '') + keyLabel;
  }
  const parts = [];
  if (b.mod) parts.push('Ctrl');
  if (b.alt) parts.push('Alt');
  if (b.shift) parts.push('Shift');
  parts.push(keyLabel);
  return parts.join('+');
}

export const isModifierKey = (key: string) =>
  ['control', 'meta', 'alt', 'shift'].includes(key.toLowerCase());

/** Build a normalized combo string from a keyboard event, e.g. "ctrl+shift+k" */
export function comboFromEvent(e: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.metaKey) parts.push('meta');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  const k = e.key.toLowerCase();
  if (!isModifierKey(k)) parts.push(k === ' ' ? 'space' : k);
  return parts.join('+');
}

/** Whether the combo has at least one non-modifier key plus a modifier */
export function isValidCombo(combo: string): boolean {
  if (!combo) return false;
  const parts = combo.split('+');
  const hasModifier = parts.some((p) => ['ctrl', 'meta', 'alt', 'shift'].includes(p));
  const hasKey = parts.some((p) => !['ctrl', 'meta', 'alt', 'shift'].includes(p));
  return hasModifier && hasKey;
}

/** Pretty label for display, e.g. "Ctrl + Shift + K" */
export function prettyCombo(combo: string): string {
  if (!combo) return '';
  const map: Record<string, string> = {
    ctrl: 'Ctrl',
    meta: 'Cmd',
    alt: 'Alt',
    shift: 'Shift',
  };
  return combo
    .split('+')
    .map((p) => map[p] ?? p.toUpperCase())
    .join(' + ');
}

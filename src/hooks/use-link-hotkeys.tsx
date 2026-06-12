import { useEffect } from 'react';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { comboFromEvent } from '@/utils/hotkeys';
import { toast } from 'sonner';

/**
 * Atalhos globais para abrir os Links Úteis cadastrados pelo usuário.
 * Cada link pode ter um atalho próprio (ex: Ctrl + Shift + K).
 */
export function useLinkHotkeys() {
  const { usefulLinks } = useTimeTracker();

  useEffect(() => {
    const linksWithHotkey = usefulLinks.filter((l) => l.hotkey);
    if (linksWithHotkey.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      // só dispara quando há ao menos um modificador para evitar conflito com digitação
      if (!(e.ctrlKey || e.metaKey || e.altKey)) return;
      const combo = comboFromEvent(e);
      const match = linksWithHotkey.find((l) => l.hotkey === combo);
      if (match) {
        e.preventDefault();
        window.open(match.url, '_blank', 'noopener,noreferrer');
        toast.success(`Abrindo: ${match.title || match.url}`);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [usefulLinks]);
}

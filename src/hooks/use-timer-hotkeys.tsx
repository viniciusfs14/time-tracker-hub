import { useEffect } from 'react';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { toast } from 'sonner';

/**
 * Atalhos globais de teclado para os cronômetros.
 * - Ctrl/Cmd + Shift + S  -> inicia um novo cronômetro imediatamente
 * - Ctrl/Cmd + Shift + U  -> inicia um cronômetro URGENTE imediatamente
 * - Ctrl/Cmd + Shift + X  -> finaliza (salva) o cronômetro iniciado mais recentemente
 * - Ctrl/Cmd + Shift + P  -> pausa/retoma todos os cronômetros
 */
export function useTimerHotkeys() {
  const { addTimer, stopTimer, timers, pauseAll, resumeAll } = useTimeTracker();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || !e.shiftKey) return;
      const key = e.key.toLowerCase();

      if (key === 's') {
        e.preventDefault();
        addTimer();
        toast.success('Cronômetro iniciado', { description: 'Atalho Ctrl+Shift+S' });
      } else if (key === 'u') {
        e.preventDefault();
        addTimer('', '', { urgent: true });
        toast.error('Cronômetro URGENTE iniciado', { description: 'Atalho Ctrl+Shift+U' });
      } else if (key === 'x') {
        e.preventDefault();
        const last = [...timers].sort((a, b) => b.createdAt - a.createdAt)[0];
        if (last) {
          stopTimer(last.id);
          toast.success('Cronômetro finalizado e salvo', { description: 'Atalho Ctrl+Shift+X' });
        } else {
          toast.info('Nenhum cronômetro ativo');
        }
      } else if (key === 'p') {
        e.preventDefault();
        const anyRunning = timers.some((t) => t.status === 'running');
        if (timers.length === 0) {
          toast.info('Nenhum cronômetro ativo');
          return;
        }
        if (anyRunning) {
          pauseAll();
          toast('Todos pausados', { description: 'Atalho Ctrl+Shift+P' });
        } else {
          resumeAll();
          toast('Todos retomados', { description: 'Atalho Ctrl+Shift+P' });
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addTimer, stopTimer, timers, pauseAll, resumeAll]);
}

export const HOTKEYS = [
  { combo: 'Ctrl + Shift + S', desc: 'Novo cronômetro' },
  { combo: 'Ctrl + Shift + U', desc: 'Cronômetro urgente' },
  { combo: 'Ctrl + Shift + X', desc: 'Finalizar o mais recente' },
  { combo: 'Ctrl + Shift + P', desc: 'Pausar / retomar todos' },
];

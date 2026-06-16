import { Plus, Zap, Clock, Keyboard, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { useTimerHotkeys, HOTKEYS } from '@/hooks/use-timer-hotkeys';
import { TimerCard } from '@/components/TimerCard';

export function TimersPanel() {
  const { timers, addTimer, pauseAll, resumeAll } = useTimeTracker();
  useTimerHotkeys();

  const anyRunning = timers.some((t) => t.status === 'running');

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Cronômetros</h2>
            <p className="text-xs text-muted-foreground">
              {timers.length === 0 ? 'Nenhum ativo' : `${timers.length} ativo(s)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => (anyRunning ? pauseAll() : resumeAll())}
            >
              {anyRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {anyRunning ? 'Pausar todos' : 'Retomar todos'}
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" title="Atalhos de teclado">
                <Keyboard className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Keyboard className="w-4 h-4" /> Atalhos de teclado
              </p>
              <ul className="space-y-2">
                {HOTKEYS.map((h) => (
                  <li key={h.combo} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{h.desc}</span>
                    <kbd className="px-2 py-1 rounded-md bg-muted border border-border text-xs font-mono whitespace-nowrap">
                      {h.combo}
                    </kbd>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button onClick={() => addTimer()} className="flex-1 h-12 gap-2 text-base font-medium">
          <Plus className="w-5 h-5" /> Novo cronômetro
        </Button>
        <Button
          variant="outline"
          onClick={() => addTimer('', '', { urgent: true })}
          className="flex-1 h-12 gap-2 text-base font-medium border-destructive text-destructive hover:bg-destructive/10"
        >
          <Zap className="w-5 h-5" /> Urgente
        </Button>
      </div>

      {timers.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>Nenhum cronômetro em execução.</p>
          <p className="text-sm mt-1">
            Use <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-xs font-mono">Ctrl+Shift+S</kbd> para iniciar rapidamente.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...timers]
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
            .map((t) => (
              <TimerCard key={t.id} timer={t} />
            ))}
        </div>
      )}
    </div>
  );
}

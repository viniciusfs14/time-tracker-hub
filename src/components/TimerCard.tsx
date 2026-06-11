import { useState, useEffect } from 'react';
import { Play, Pause, Square, Trash2, Zap, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { RunningTimer } from '@/types';
import { formatTime } from '@/utils/time';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function TimerCard({ timer }: { timer: RunningTimer }) {
  const { pauseTimer, resumeTimer, stopTimer, removeTimer, updateTimer } = useTimeTracker();
  const [displayMs, setDisplayMs] = useState(0);

  useEffect(() => {
    const compute = () =>
      timer.status === 'running'
        ? timer.accumulatedTime + (Date.now() - (timer.startTime || Date.now()))
        : timer.accumulatedTime;

    setDisplayMs(compute());
    if (timer.status !== 'running') return;
    const interval = setInterval(() => setDisplayMs(compute()), 250);
    return () => clearInterval(interval);
  }, [timer]);

  const handleStop = async () => {
    await stopTimer(timer.id);
    toast.success('Registro salvo!');
  };

  const seconds = Math.floor(displayMs / 1000);

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all duration-300 bg-card/60 backdrop-blur',
        timer.urgent ? 'border-destructive/50 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]' : 'border-border/60',
        timer.status === 'running' && 'ring-1 ring-primary/30'
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {timer.urgent && (
            <span className="flex items-center gap-1 text-xs font-semibold text-destructive shrink-0">
              <Zap className="w-3.5 h-3.5" /> Urgente
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium',
              timer.status === 'running' ? 'text-success' : 'text-warning'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                timer.status === 'running' ? 'bg-success animate-pulse' : 'bg-warning'
              )}
            />
            {timer.status === 'running' ? 'Em andamento' : 'Pausado'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => removeTimer(timer.id)}
          title="Descartar sem salvar"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div
        className={cn(
          'timer-display text-center py-4 rounded-xl bg-muted/50 border border-border/50 mb-4 font-mono text-3xl md:text-4xl',
          timer.status === 'running' && 'text-primary'
        )}
      >
        {formatTime(seconds)}
      </div>

      <div className="space-y-2 mb-4">
        <Input
          placeholder="Nome da atividade..."
          value={timer.activity}
          onChange={(e) => updateTimer(timer.id, { activity: e.target.value })}
          className="h-10"
        />
        <div className="relative">
          <Ticket className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="RITM (opcional)"
            value={timer.ritmCode}
            onChange={(e) => updateTimer(timer.id, { ritmCode: e.target.value })}
            className="h-10 pl-9 font-mono"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {timer.status === 'running' ? (
          <Button variant="outline" className="flex-1 gap-2 border-warning text-warning hover:bg-warning/10" onClick={() => pauseTimer(timer.id)}>
            <Pause className="w-4 h-4" /> Pausar
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 gap-2" onClick={() => resumeTimer(timer.id)}>
            <Play className="w-4 h-4" /> Retomar
          </Button>
        )}
        <Button className="flex-1 gap-2 bg-success hover:bg-success/90" onClick={handleStop}>
          <Square className="w-4 h-4" /> Finalizar
        </Button>
      </div>
    </div>
  );
}

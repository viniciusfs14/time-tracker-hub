import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { formatTime } from '@/utils/time';
import { cn } from '@/lib/utils';

export function Timer() {
  const { timer, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimeTracker();
  const [activity, setActivity] = useState('');
  const [hasRitm, setHasRitm] = useState(false);
  const [ritmCode, setRitmCode] = useState('');
  const [displayTime, setDisplayTime] = useState(0);

  // Update display time every second
  useEffect(() => {
    if (timer.status !== 'running') {
      setDisplayTime(timer.accumulatedTime);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = timer.accumulatedTime + (Date.now() - (timer.startTime || Date.now()));
      setDisplayTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [timer]);

  const handleStart = () => {
    if (!activity.trim()) return;
    const fullActivity = hasRitm && ritmCode ? `${activity} [${ritmCode.toUpperCase()}]` : activity;
    startTimer(fullActivity, hasRitm ? ritmCode : undefined);
    setActivity('');
    setRitmCode('');
    setHasRitm(false);
  };

  const handleStop = () => {
    stopTimer();
  };

  const isInputDisabled = timer.status !== 'stopped';
  const displaySeconds = Math.floor(displayTime / 1000);

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Cronômetro</h2>
      </div>

      {/* Timer Display */}
      <div className="relative mb-8">
        <div className={cn(
          "timer-display text-center py-8 px-4 rounded-2xl bg-muted/50 border border-border/50 transition-all duration-300",
          timer.status === 'running' && "timer-active",
          timer.status === 'paused' && "timer-paused",
          timer.status === 'stopped' && "timer-stopped"
        )}>
          {formatTime(displaySeconds)}
        </div>
        
        {timer.status === 'running' && (
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse-ring pointer-events-none" />
        )}
      </div>

      {/* Activity Input */}
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="activity" className="text-sm font-medium">
            Atividade Atual
          </Label>
          <Input
            id="activity"
            placeholder="Ex: Desenvolvimento Frontend..."
            value={isInputDisabled ? timer.currentActivity : activity}
            onChange={(e) => setActivity(e.target.value)}
            disabled={isInputDisabled}
            className="h-12"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasRitm"
              checked={hasRitm}
              onCheckedChange={(checked) => setHasRitm(checked as boolean)}
              disabled={isInputDisabled}
            />
            <Label htmlFor="hasRitm" className="text-sm cursor-pointer">
              Vincular RITM
            </Label>
          </div>

          {hasRitm && (
            <Input
              placeholder="RITM0000"
              value={ritmCode}
              onChange={(e) => setRitmCode(e.target.value)}
              disabled={isInputDisabled}
              className="flex-1 h-10"
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {timer.status === 'stopped' && (
          <Button
            onClick={handleStart}
            disabled={!activity.trim()}
            className="flex-1 h-12 gap-2 text-base font-medium"
            size="lg"
          >
            <Play className="w-5 h-5" />
            Iniciar
          </Button>
        )}

        {timer.status === 'running' && (
          <>
            <Button
              onClick={pauseTimer}
              variant="outline"
              className="flex-1 h-12 gap-2 text-base font-medium border-warning text-warning hover:bg-warning/10"
              size="lg"
            >
              <Pause className="w-5 h-5" />
              Pausar
            </Button>
            <Button
              onClick={handleStop}
              className="flex-1 h-12 gap-2 text-base font-medium bg-success hover:bg-success/90"
              size="lg"
            >
              <Square className="w-5 h-5" />
              Finalizar
            </Button>
          </>
        )}

        {timer.status === 'paused' && (
          <>
            <Button
              onClick={resumeTimer}
              className="flex-1 h-12 gap-2 text-base font-medium"
              size="lg"
            >
              <Play className="w-5 h-5" />
              Retomar
            </Button>
            <Button
              onClick={handleStop}
              className="flex-1 h-12 gap-2 text-base font-medium bg-success hover:bg-success/90"
              size="lg"
            >
              <Square className="w-5 h-5" />
              Finalizar
            </Button>
          </>
        )}
      </div>

      {/* Status Indicator */}
      {timer.status !== 'stopped' && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className={cn(
            "w-2 h-2 rounded-full",
            timer.status === 'running' && "bg-success animate-pulse",
            timer.status === 'paused' && "bg-warning"
          )} />
          <span>
            {timer.status === 'running' ? 'Em andamento' : 'Pausado'}
            {timer.currentActivity && ` — ${timer.currentActivity}`}
          </span>
        </div>
      )}
    </div>
  );
}

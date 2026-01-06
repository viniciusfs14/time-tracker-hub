import { useMemo } from 'react';
import { History, Timer, PenLine } from 'lucide-react';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatTime, formatDate } from '@/utils/time';
import { cn } from '@/lib/utils';

export function RecentEntries() {
  const { entries } = useTimeTracker();
  const { user } = useAuth();

  const recentEntries = useMemo(() => {
    if (!user) return [];
    return entries
      .filter(e => e.userId === user.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [entries, user]);

  if (recentEntries.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Registros Recentes</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Nenhum registro encontrado. Comece a cronometrar suas atividades!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <History className="w-5 h-5 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Registros Recentes</h2>
      </div>

      <div className="space-y-3">
        {recentEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              entry.type === 'timer' ? "bg-primary/10" : "bg-secondary/10"
            )}>
              {entry.type === 'timer' ? (
                <Timer className="w-4 h-4 text-primary" />
              ) : (
                <PenLine className="w-4 h-4 text-secondary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{entry.activity}</p>
              <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
            </div>
            
            <div className="text-right flex-shrink-0">
              <p className="font-mono font-semibold text-primary">
                {formatTime(entry.duration)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { Clock, Calendar, Target, StickyNote } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer } from '@/components/Timer';
import { ManualEntry } from '@/components/ManualEntry';
import { RitmManager } from '@/components/RitmManager';
import { ActivityChart } from '@/components/ActivityChart';
import { RecentEntries } from '@/components/RecentEntries';
import { StatsCard } from '@/components/StatsCard';
import { NotesPanel } from '@/components/NotesPanel';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { formatTime, formatTimeShort } from '@/utils/time';

export function EmployeeDashboard() {
  const { timer, getTodayTotal, getEntriesByPeriod } = useTimeTracker();

  const stats = useMemo(() => {
    const todayTotal = getTodayTotal();
    const weekEntries = getEntriesByPeriod(7);
    const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);
    const tasksToday = getEntriesByPeriod(1).length;

    // Add current timer if running
    let currentSession = 0;
    if (timer.status === 'running' && timer.startTime) {
      currentSession = Math.floor((Date.now() - timer.startTime + timer.accumulatedTime) / 1000);
    } else if (timer.status === 'paused') {
      currentSession = Math.floor(timer.accumulatedTime / 1000);
    }

    return {
      todayTotal: todayTotal + currentSession,
      weekTotal,
      tasksToday: tasksToday + (timer.status !== 'stopped' ? 1 : 0),
    };
  }, [timer, getTodayTotal, getEntriesByPeriod]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meu Ponto</h1>
          <p className="text-muted-foreground">Gerencie suas atividades diárias</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Hoje"
          value={formatTime(stats.todayTotal)}
          icon={Clock}
          variant="primary"
        />
        <StatsCard
          title="Esta Semana"
          value={formatTimeShort(stats.weekTotal)}
          icon={Calendar}
          variant="success"
        />
        <StatsCard
          title="Tarefas Hoje"
          value={stats.tasksToday}
          icon={Target}
          variant="warning"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="timer" className="gap-2">
            <Clock className="w-4 h-4" />
            Cronômetro
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            📝 Manual
          </TabsTrigger>
          <TabsTrigger value="ritm" className="gap-2">
            💼 Chamados
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="w-4 h-4" />
            Notas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-0">
          <NotesPanel />
        </TabsContent>

        <div className="grid lg:grid-cols-2 gap-6">
          <TabsContent value="timer" className="mt-0">
            <Timer />
          </TabsContent>

          <TabsContent value="manual" className="mt-0">
            <ManualEntry />
          </TabsContent>

          <TabsContent value="ritm" className="mt-0">
            <RitmManager />
          </TabsContent>

          <div className="space-y-6">
            <ActivityChart />
            <RecentEntries />
          </div>
        </div>
      </Tabs>
    </div>
  );
}

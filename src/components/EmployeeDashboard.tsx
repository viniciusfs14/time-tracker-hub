import { useMemo } from 'react';
import { Clock, Calendar, Target, StickyNote, Link2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimersPanel } from '@/components/TimersPanel';
import { ManualEntry } from '@/components/ManualEntry';
import { RitmManager } from '@/components/RitmManager';
import { ActivityChart } from '@/components/ActivityChart';
import { RecentEntries } from '@/components/RecentEntries';
import { StatsCard } from '@/components/StatsCard';
import { NotesPanel } from '@/components/NotesPanel';
import { UsefulLinksPanel } from '@/components/UsefulLinksPanel';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { formatTime, formatTimeShort } from '@/utils/time';


export function EmployeeDashboard() {
  const { timers, getTodayTotal, getEntriesByPeriod } = useTimeTracker();

  const stats = useMemo(() => {
    const todayTotal = getTodayTotal();
    const weekEntries = getEntriesByPeriod(7);
    const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration, 0);
    const tasksToday = getEntriesByPeriod(1).length;

    // Add all active timers' running time
    const activeSession = timers.reduce((sum, t) => {
      const ms =
        t.status === 'running'
          ? t.accumulatedTime + (Date.now() - (t.startTime || Date.now()))
          : t.accumulatedTime;
      return sum + Math.floor(ms / 1000);
    }, 0);

    return {
      todayTotal: todayTotal + activeSession,
      weekTotal,
      tasksToday: tasksToday + timers.length,
    };
  }, [timers, getTodayTotal, getEntriesByPeriod]);


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
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="w-4 h-4" />
            Links Úteis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-0">
          <NotesPanel />
        </TabsContent>

        <TabsContent value="links" className="mt-0">
          <UsefulLinksPanel />
        </TabsContent>


        <div className="grid lg:grid-cols-2 gap-6">
          <TabsContent value="timer" className="mt-0">
            <TimersPanel />
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

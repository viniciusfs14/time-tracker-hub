import { useMemo } from 'react';
import { Clock, Calendar, CalendarRange, Target, Ticket, Gauge } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { ActivityChart } from '@/components/ActivityChart';
import { RecentEntries } from '@/components/RecentEntries';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatTime, formatTimeShort } from '@/utils/time';

export function StatsPanel() {
  const { timers, ritms, entries, getTodayTotal, getEntriesByPeriod } = useTimeTracker();
  const { user } = useAuth();

  const stats = useMemo(() => {
    const todayTotal = getTodayTotal();
    const weekTotal = getEntriesByPeriod(7).reduce((s, e) => s + e.duration, 0);
    const monthEntries = getEntriesByPeriod(30);
    const monthTotal = monthEntries.reduce((s, e) => s + e.duration, 0);
    const tasksToday = getEntriesByPeriod(1).length;

    const activeSession = timers.reduce((sum, t) => {
      const ms =
        t.status === 'running'
          ? t.accumulatedTime + (Date.now() - (t.startTime || Date.now()))
          : t.accumulatedTime;
      return sum + Math.floor(ms / 1000);
    }, 0);

    const myEntries = entries.filter((e) => e.userId === user?.id);
    const totalSeconds = myEntries.reduce((s, e) => s + e.duration, 0);
    const avgPerTask = myEntries.length ? Math.round(totalSeconds / myEntries.length) : 0;
    const myRitms = ritms.filter((r) => r.userId === user?.id && !r.archived).length;

    return {
      todayTotal: todayTotal + activeSession,
      weekTotal,
      monthTotal,
      tasksToday: tasksToday + timers.length,
      avgPerTask,
      myRitms,
      totalTasks: myEntries.length,
    };
  }, [timers, ritms, entries, user, getTodayTotal, getEntriesByPeriod]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard title="Hoje" value={formatTime(stats.todayTotal)} icon={Clock} variant="primary" />
        <StatsCard title="Esta Semana" value={formatTimeShort(stats.weekTotal)} icon={Calendar} variant="success" />
        <StatsCard title="Últimos 30 dias" value={formatTimeShort(stats.monthTotal)} icon={CalendarRange} variant="default" />
        <StatsCard title="Tarefas Hoje" value={stats.tasksToday} icon={Target} variant="warning" />
        <StatsCard title="Média por Tarefa" value={formatTime(stats.avgPerTask)} icon={Gauge} variant="default" />
        <StatsCard title="Chamados Ativos" value={stats.myRitms} icon={Ticket} variant="primary" trend={`${stats.totalTasks} registros no total`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ActivityChart />
        <RecentEntries />
      </div>
    </div>
  );
}

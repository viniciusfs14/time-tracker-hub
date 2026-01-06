import { useMemo, useState } from 'react';
import { Users, Clock, BarChart3, Calendar, Filter, Ticket, Lock, Unlock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/StatsCard';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { formatTime, formatDate, extractRitmCode } from '@/utils/time';
import { cn } from '@/lib/utils';

export function AdminDashboard() {
  const { entries, ritmStatuses } = useTimeTracker();
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  const dates = useMemo(() => {
    const uniqueDates = [...new Set(entries.map(e => e.date))].sort((a, b) => b.localeCompare(a));
    return uniqueDates;
  }, [entries]);

  const users = useMemo(() => {
    const uniqueUsers = [...new Set(entries.map(e => e.userId))];
    return uniqueUsers;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (selectedDate !== 'all' && e.date !== selectedDate) return false;
      if (selectedUser !== 'all' && e.userId !== selectedUser) return false;
      return true;
    });
  }, [entries, selectedDate, selectedUser]);

  const stats = useMemo(() => {
    const totalSeconds = filteredEntries.reduce((sum, e) => sum + e.duration, 0);
    const totalTasks = filteredEntries.length;
    const avgSeconds = totalTasks > 0 ? totalSeconds / totalTasks : 0;

    return {
      totalTime: formatTime(totalSeconds),
      totalTasks,
      avgTime: formatTime(Math.round(avgSeconds)),
    };
  }, [filteredEntries]);

  const ritmSummary = useMemo(() => {
    const ritmMap = new Map<string, { code: string; totalTime: number; status: 'open' | 'closed' }>();

    entries.forEach(entry => {
      const code = entry.ritmCode || extractRitmCode(entry.activity);
      if (!code) return;

      const ritmStatus = ritmStatuses.find(r => r.code === code);
      const existing = ritmMap.get(code);

      if (existing) {
        existing.totalTime += entry.duration;
      } else {
        ritmMap.set(code, {
          code,
          totalTime: entry.duration,
          status: ritmStatus?.status || 'open',
        });
      }
    });

    return Array.from(ritmMap.values());
  }, [entries, ritmStatuses]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel de Gestão</h1>
          <p className="text-muted-foreground">Visualize os registros da equipe</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="ritms" className="gap-2">
            <Ticket className="w-4 h-4" />
            Chamados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  {dates.map(date => (
                    <SelectItem key={date} value={date}>
                      {formatDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Total de Horas"
              value={stats.totalTime}
              icon={Clock}
              variant="primary"
            />
            <StatsCard
              title="Tarefas"
              value={stats.totalTasks}
              icon={Calendar}
              variant="success"
            />
            <StatsCard
              title="Média por Tarefa"
              value={stats.avgTime}
              icon={BarChart3}
              variant="warning"
            />
          </div>

          {/* Entries Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Registros</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Usuário</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Atividade</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Duração</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{entry.userId}</td>
                        <td className="px-4 py-3 text-sm">{entry.activity}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 text-sm font-mono font-medium text-primary">{formatTime(entry.duration)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            entry.type === 'timer'
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary/10 text-secondary"
                          )}>
                            {entry.type === 'timer' ? 'Timer' : 'Manual'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ritms" className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Status dos Chamados</h3>
            
            {ritmSummary.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum RITM encontrado nos registros.
              </p>
            ) : (
              <div className="space-y-3">
                {ritmSummary.map(ritm => (
                  <div
                    key={ritm.code}
                    className={cn(
                      "p-4 rounded-xl border-l-4",
                      ritm.status === 'open'
                        ? "bg-success/5 border-success"
                        : "bg-muted/50 border-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{ritm.code}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {ritm.status === 'open' ? (
                            <><Unlock className="w-4 h-4 text-success" /> Em Andamento</>
                          ) : (
                            <><Lock className="w-4 h-4" /> Encerrado</>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-primary">{formatTime(ritm.totalTime)}</p>
                        <p className="text-xs text-muted-foreground">tempo total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

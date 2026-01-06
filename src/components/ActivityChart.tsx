import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { cn } from '@/lib/utils';

type Period = 'today' | '7days' | '30days';

export function ActivityChart() {
  const { getEntriesByPeriod } = useTimeTracker();
  const [period, setPeriod] = useState<Period>('today');

  const data = useMemo(() => {
    const days = period === 'today' ? 1 : period === '7days' ? 7 : 30;
    const entries = getEntriesByPeriod(days);

    const activityMap = new Map<string, number>();
    entries.forEach(entry => {
      const existing = activityMap.get(entry.activity) || 0;
      activityMap.set(entry.activity, existing + entry.duration / 3600);
    });

    return Array.from(activityMap.entries())
      .map(([name, hours]) => ({ name: name.slice(0, 25), hours: Number(hours.toFixed(2)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  }, [getEntriesByPeriod, period]);

  const periods: { value: Period; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: '7days', label: '7 Dias' },
    { value: '30days', label: '30 Dias' },
  ];

  const colors = [
    'hsl(280 75% 35%)',
    'hsl(280 55% 50%)',
    'hsl(280 45% 60%)',
    'hsl(280 35% 70%)',
    'hsl(280 25% 75%)',
    'hsl(280 20% 80%)',
  ];

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Minhas Estatísticas</h2>
        </div>

        <div className="flex gap-2">
          {periods.map(({ value, label }) => (
            <Button
              key={value}
              variant={period === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(value)}
              className={cn(
                "text-sm",
                period === value && "shadow-soft"
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Nenhum registro encontrado para este período.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis 
                type="number" 
                tickFormatter={(val) => `${val}h`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}h`, 'Horas']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

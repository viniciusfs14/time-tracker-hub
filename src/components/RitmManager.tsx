import { useMemo } from 'react';
import { Ticket, Mail, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatTime, extractRitmCode } from '@/utils/time';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function RitmManager() {
  const { entries, ritmStatuses, updateRitmStatus } = useTimeTracker();
  const { user } = useAuth();

  const userRitms = useMemo(() => {
    if (!user) return [];

    const ritmMap = new Map<string, { code: string; totalTime: number; status: 'open' | 'closed' }>();

    entries
      .filter(e => e.userId === user.id)
      .forEach(entry => {
        const code = entry.ritmCode || extractRitmCode(entry.activity);
        if (!code) return;

        const existing = ritmMap.get(code);
        const ritmStatus = ritmStatuses.find(r => r.code === code);
        
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
  }, [entries, ritmStatuses, user]);

  const handleStatusToggle = (code: string, currentStatus: 'open' | 'closed') => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    updateRitmStatus(code, newStatus);
    toast.success(newStatus === 'closed' ? 'Chamado encerrado!' : 'Chamado reaberto!');
  };

  const handlePrepareEmail = (code: string, totalTime: number) => {
    const subject = encodeURIComponent(`Encerramento do Chamado ${code}`);
    const body = encodeURIComponent(
      `Prezados,\n\nInformamos que o chamado ${code} foi concluído.\n\nTempo total investido: ${formatTime(totalTime)}\n\nAtenciosamente,\n${user?.name}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (userRitms.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Ticket className="w-5 h-5 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Gestão de Chamados</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Você ainda não registrou atividades vinculadas a um RITM.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <Ticket className="w-5 h-5 text-accent-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Gestão de Chamados</h2>
      </div>

      <div className="space-y-4">
        {userRitms.map((ritm) => (
          <div
            key={ritm.code}
            className={cn(
              "p-4 rounded-xl border transition-all duration-200",
              ritm.status === 'open'
                ? "bg-success/5 border-success/30"
                : "bg-muted/50 border-border"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{ritm.code}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "flex items-center gap-1",
                    ritm.status === 'open' ? "text-success" : "text-muted-foreground"
                  )}>
                    {ritm.status === 'open' ? (
                      <><Unlock className="w-4 h-4" /> Em Andamento</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Encerrado</>
                    )}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Tempo total: <span className="font-medium text-foreground">{formatTime(ritm.totalTime)}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={ritm.status === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusToggle(ritm.code, ritm.status)}
                  className="gap-2"
                >
                  {ritm.status === 'open' ? (
                    <><Lock className="w-4 h-4" /> Encerrar</>
                  ) : (
                    <><Unlock className="w-4 h-4" /> Reabrir</>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePrepareEmail(ritm.code, ritm.totalTime)}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

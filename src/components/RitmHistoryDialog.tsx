import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { Ritm, RitmHistoryEntry } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritm: Ritm | null;
}

const statusText: Record<string, string> = {
  open: 'Em andamento',
  pending: 'Pendente',
  closed: 'Encerrado',
  true: 'Sim',
  false: 'Não',
};

const fmt = (v: string | null) => {
  if (v === null || v === '') return '—';
  return statusText[v] || v;
};

export function RitmHistoryDialog({ open, onOpenChange, ritm }: Props) {
  const { getRitmHistory } = useTimeTracker();
  const [history, setHistory] = useState<RitmHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ritm) {
      setLoading(true);
      getRitmHistory(ritm.id).then((h) => {
        setHistory(h);
        setLoading(false);
      });
    }
  }, [open, ritm, getRitmHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Histórico — {ritm?.code}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : history.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma alteração registrada.</p>
        ) : (
          <ol className="relative border-l border-border ml-2 space-y-4 py-2">
            {history.map((h) => (
              <li key={h.id} className="ml-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <p className="text-sm">
                  {h.field === 'Chamado' ? (
                    <span className="font-medium">Chamado criado</span>
                  ) : (
                    <>
                      <span className="font-medium">{h.field}</span> alterado de{' '}
                      <span className="text-muted-foreground line-through">{fmt(h.oldValue)}</span> para{' '}
                      <span className="text-primary font-medium">{fmt(h.newValue)}</span>
                    </>
                  )}
                </p>
                <time className="text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString('pt-BR')}
                </time>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

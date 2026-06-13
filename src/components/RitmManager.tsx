import { useMemo, useState } from 'react';
import {
  Ticket,
  Mail,
  Plus,
  Pencil,
  History,
  Archive,
  ArchiveRestore,
  Trash2,
  CircleDot,
  PauseCircle,
  CheckCircle2,
  ChevronDown,
  Timer,
  PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Ritm, RitmStatusValue } from '@/types';
import { formatTime, formatDate } from '@/utils/time';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RitmFormDialog } from '@/components/RitmFormDialog';
import { RitmHistoryDialog } from '@/components/RitmHistoryDialog';

const STATUS_META: Record<RitmStatusValue, { label: string; icon: typeof CircleDot; cls: string }> = {
  open: { label: 'Em andamento', icon: CircleDot, cls: 'bg-success/10 text-success border-success/30' },
  pending: { label: 'Pendente', icon: PauseCircle, cls: 'bg-warning/10 text-warning border-warning/30' },
  closed: { label: 'Encerrado', icon: CheckCircle2, cls: 'bg-muted text-muted-foreground border-border' },
};

const DetailRow = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground break-words">{value}</span>
    </div>
  ) : null;

export function RitmManager() {
  const { ritms, entries, getRitmTotalTime, setRitmArchived, deleteRitm } = useTimeTracker();
  const { user } = useAuth();

  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<Ritm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ritm | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const myRitms = useMemo(
    () => ritms.filter((r) => r.userId === user?.id && r.archived === showArchived),
    [ritms, user, showArchived]
  );

  const archivedCount = useMemo(
    () => ritms.filter((r) => r.userId === user?.id && r.archived).length,
    [ritms, user]
  );

  const entriesForCode = (code: string) =>
    entries
      .filter((e) => e.userId === user?.id && (e.ritmCode || '').toUpperCase() === code.toUpperCase())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (ritm: Ritm) => {
    setSelected(ritm);
    setFormOpen(true);
  };

  const openHistory = (ritm: Ritm) => {
    setSelected(ritm);
    setHistoryOpen(true);
  };

  const handleEmail = (ritm: Ritm) => {
    const subject = encodeURIComponent(`Chamado ${ritm.code}${ritm.title ? ` - ${ritm.title}` : ''}`);
    const lines = [
      'Prezados,',
      '',
      `Segue atualização do item requisitado ${ritm.code}.`,
      '',
      `Status: ${STATUS_META[ritm.status].label}`,
      ritm.status === 'pending' && ritm.pendingReason ? `Motivo da pendência: ${ritm.pendingReason}` : '',
      ritm.requestType ? `Tipo de solicitação: ${ritm.requestType}` : '',
      ritm.requester ? `Solicitante: ${ritm.requester}` : '',
      ritm.requesterEmail ? `Email do solicitante: ${ritm.requesterEmail}` : '',
      ritm.operationalUnit ? `Unidade Operacional: ${ritm.operationalUnit}` : '',
      ritm.locality ? `Localidade: ${ritm.locality}` : '',
      ritm.pims ? `PIMS: ${ritm.pims}` : '',
      ritm.pep ? `PEP: ${ritm.pep}` : '',
      ritm.observation ? `Observação: ${ritm.observation}` : '',
      `Tempo total investido: ${formatTime(getRitmTotalTime(ritm.code))}`,
      '',
      'Atenciosamente,',
      user?.name ?? '',
    ];
    const body = encodeURIComponent(lines.filter((l) => l !== '').join('\n'));
    window.open(`mailto:${ritm.requesterEmail ? encodeURIComponent(ritm.requesterEmail) : ''}?subject=${subject}&body=${body}`, '_blank');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteRitm(deleteTarget.id);
    toast.success('Chamado excluído');
    setDeleteTarget(null);
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Ticket className="w-5 h-5 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Gestão de Chamados</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowArchived((s) => !s)}
          >
            {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {showArchived ? 'Ver ativos' : `Arquivados${archivedCount ? ` (${archivedCount})` : ''}`}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Novo
          </Button>
        </div>
      </div>

      {myRitms.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          {showArchived ? 'Nenhum chamado arquivado.' : 'Nenhum chamado cadastrado. Crie o primeiro!'}
        </p>
      ) : (
        <div className="space-y-4">
          {myRitms.map((ritm) => {
            const meta = STATUS_META[ritm.status];
            const StatusIcon = meta.icon;
            const isExpanded = expandedId === ritm.id;
            const ritmEntries = isExpanded ? entriesForCode(ritm.code) : [];
            return (
              <div
                key={ritm.id}
                className="rounded-xl border border-border bg-card/40 transition-all hover:border-primary/30"
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <button
                    className="space-y-1.5 min-w-0 text-left flex-1"
                    onClick={() => setExpandedId(isExpanded ? null : ritm.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <ChevronDown
                        className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
                      />
                      <h3 className="font-semibold font-mono text-lg">{ritm.code}</h3>
                      <Badge variant="outline" className={cn('gap-1', meta.cls)}>
                        <StatusIcon className="w-3 h-3" /> {meta.label}
                      </Badge>
                      {ritm.category && (
                        <Badge variant="secondary" className="font-normal">
                          {ritm.category}
                        </Badge>
                      )}
                    </div>
                    {ritm.title && <p className="font-medium">{ritm.title}</p>}
                    {ritm.requester && (
                      <p className="text-sm text-muted-foreground">
                        Solicitante: {ritm.requester}
                        {ritm.requesterEmail ? ` (${ritm.requesterEmail})` : ''}
                      </p>
                    )}
                    {ritm.status === 'pending' && ritm.pendingReason && (
                      <p className="text-sm text-warning">Pendência: {ritm.pendingReason}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Tempo total:{' '}
                      <span className="font-mono font-medium text-foreground">
                        {formatTime(getRitmTotalTime(ritm.code))}
                      </span>
                    </p>
                  </button>

                  <div className="flex gap-1 flex-wrap shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9" title="Editar" onClick={() => openEdit(ritm)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" title="Histórico" onClick={() => openHistory(ritm)}>
                      <History className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" title="Enviar email" onClick={() => handleEmail(ritm)}>
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      title={ritm.archived ? 'Desarquivar' : 'Arquivar'}
                      onClick={() => {
                        setRitmArchived(ritm.id, !ritm.archived);
                        toast.success(ritm.archived ? 'Chamado reativado' : 'Chamado arquivado');
                      }}
                    >
                      {ritm.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      title="Excluir"
                      onClick={() => setDeleteTarget(ritm)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4 animate-fade-in">
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      <DetailRow label="Descrição" value={ritm.description} />
                      <DetailRow label="Tipo de solicitação" value={ritm.requestType} />
                      <DetailRow label="Unidade Operacional" value={ritm.operationalUnit} />
                      <DetailRow label="Localidade" value={ritm.locality} />
                      <DetailRow label="PIMS" value={ritm.pims} />
                      <DetailRow label="PEP" value={ritm.pep} />
                      <DetailRow label="Email do solicitante" value={ritm.requesterEmail} />
                      <DetailRow label="Observação" value={ritm.observation} />
                      <DetailRow label="Criado em" value={formatDate(ritm.createdAt)} />
                      <DetailRow label="Atualizado em" value={formatDate(ritm.updatedAt)} />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">
                        Registros associados ({ritmEntries.length})
                      </p>
                      {ritmEntries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum registro de tempo vinculado a este chamado ainda.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {ritmEntries.map((e) => (
                            <div
                              key={e.id}
                              className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
                            >
                              <div
                                className={cn(
                                  'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                                  e.type === 'timer' ? 'bg-primary/10' : 'bg-secondary/10'
                                )}
                              >
                                {e.type === 'timer' ? (
                                  <Timer className="w-3.5 h-3.5 text-primary" />
                                ) : (
                                  <PenLine className="w-3.5 h-3.5 text-secondary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{e.activity}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                              </div>
                              <span className="font-mono text-sm font-semibold text-primary">
                                {formatTime(e.duration)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => openEdit(ritm)}>
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => openHistory(ritm)}>
                        <History className="w-3.5 h-3.5" /> Histórico
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => handleEmail(ritm)}>
                        <Mail className="w-3.5 h-3.5" /> Email
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RitmFormDialog open={formOpen} onOpenChange={setFormOpen} ritm={selected} />
      <RitmHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} ritm={selected} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir chamado {deleteTarget?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o chamado e todo o seu histórico. Os registros de tempo já lançados
              não são apagados. Se preferir manter o registro, use Arquivar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

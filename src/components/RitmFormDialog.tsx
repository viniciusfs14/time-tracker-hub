import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { Ritm, RitmInput, RitmStatusValue } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritm?: Ritm | null;
}

const empty: RitmInput = {
  code: '',
  title: '',
  description: '',
  requester: '',
  category: '',
  status: 'open',
  pendingReason: '',
};

export function RitmFormDialog({ open, onOpenChange, ritm }: Props) {
  const { createRitm, updateRitm } = useTimeTracker();
  const [form, setForm] = useState<RitmInput>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        ritm
          ? {
              code: ritm.code,
              title: ritm.title,
              description: ritm.description,
              requester: ritm.requester,
              category: ritm.category,
              status: ritm.status,
              pendingReason: ritm.pendingReason,
            }
          : empty
      );
    }
  }, [open, ritm]);

  const set = (patch: Partial<RitmInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error('Informe o código do chamado');
      return;
    }
    if (form.status === 'pending' && !form.pendingReason.trim()) {
      toast.error('Informe o motivo da pendência');
      return;
    }

    setSaving(true);
    const result = ritm ? await updateRitm(ritm.id, form) : await createRitm(form);
    setSaving(false);

    if (result.error) {
      toast.error(result.error.includes('duplicate') ? 'Já existe um chamado com esse código' : result.error);
      return;
    }
    toast.success(ritm ? 'Chamado atualizado!' : 'Chamado criado!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ritm ? 'Editar chamado' : 'Novo chamado'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do chamado. Alterações ficam registradas no histórico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                placeholder="RITM0001234"
                value={form.code}
                onChange={(e) => set({ code: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Ex: Infraestrutura"
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Resumo do chamado"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requester">Solicitante</Label>
            <Input
              id="requester"
              placeholder="Quem abriu o chamado"
              value={form.requester}
              onChange={(e) => set({ requester: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes do chamado..."
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set({ status: v as RitmStatusValue })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Em andamento</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.status === 'pending' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="pendingReason">Motivo da pendência *</Label>
              <Textarea
                id="pendingReason"
                placeholder="Por que o chamado está pendente?"
                value={form.pendingReason}
                onChange={(e) => set({ pendingReason: e.target.value })}
                rows={2}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : ritm ? 'Salvar alterações' : 'Criar chamado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

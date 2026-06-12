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
import { Ritm, RitmInput, RitmStatusValue, LocalityValue, PimsValue } from '@/types';
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
  requestType: '',
  operationalUnit: '',
  requesterEmail: '',
  locality: '',
  pims: '',
  pep: '',
  observation: '',
};

const NONE = '__none__';

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
              requestType: ritm.requestType,
              operationalUnit: ritm.operationalUnit,
              requesterEmail: ritm.requesterEmail,
              locality: ritm.locality,
              pims: ritm.pims,
              pep: ritm.pep,
              observation: ritm.observation,
            }
          : empty
      );
    }
  }, [open, ritm]);

  const set = (patch: Partial<RitmInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error('Informe o item requisitado (SCTASK - RITM)');
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
          <div className="space-y-2">
            <Label htmlFor="code">Item requisitado (SCTASK - RITM) *</Label>
            <Input
              id="code"
              placeholder="RITM0001234 / SCTASK0001234"
              value={form.code}
              onChange={(e) => set({ code: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestType">Tipo de solicitação</Label>
            <Input
              id="requestType"
              placeholder="Ex: Incidente, Requisição..."
              value={form.requestType}
              onChange={(e) => set({ requestType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label htmlFor="operationalUnit">Unidade Operacional</Label>
              <Input
                id="operationalUnit"
                placeholder="Ex: Mina, Usina..."
                value={form.operationalUnit}
                onChange={(e) => set({ operationalUnit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requesterEmail">Email do solicitante</Label>
            <Input
              id="requesterEmail"
              type="email"
              placeholder="solicitante@empresa.com"
              value={form.requesterEmail}
              onChange={(e) => set({ requesterEmail: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Localidade</Label>
              <Select
                value={form.locality || NONE}
                onValueChange={(v) => set({ locality: (v === NONE ? '' : v) as LocalityValue })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não definido</SelectItem>
                  <SelectItem value="Salobo/Sossego">Salobo/Sossego</SelectItem>
                  <SelectItem value="Ferrosos">Ferrosos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PIMS</Label>
              <Select
                value={form.pims || NONE}
                onValueChange={(v) => set({ pims: (v === NONE ? '' : v) as PimsValue })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não definido</SelectItem>
                  <SelectItem value="PI System Sul/Sudeste">PI System Sul/Sudeste</SelectItem>
                  <SelectItem value="PI System Vitória">PI System Vitória</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pep">PEP</Label>
            <Input
              id="pep"
              placeholder="Código PEP"
              value={form.pep}
              onChange={(e) => set({ pep: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <Textarea
              id="observation"
              placeholder="Observações sobre o chamado..."
              value={form.observation}
              onChange={(e) => set({ observation: e.target.value })}
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

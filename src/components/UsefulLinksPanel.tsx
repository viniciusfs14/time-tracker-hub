import { useEffect, useState } from 'react';
import { Link2, Plus, Pencil, Trash2, ExternalLink, Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { UsefulLink, UsefulLinkInput } from '@/types';
import { comboFromEvent, isValidCombo, prettyCombo } from '@/utils/hotkeys';
import { toast } from 'sonner';

function HotkeyRecorder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    const combo = comboFromEvent(e);
    if (isValidCombo(combo)) {
      onChange(combo);
      setRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setRecording((r) => !r)}
        onKeyDown={handleKeyDown}
        className={`flex-1 h-10 px-3 rounded-md border text-sm flex items-center gap-2 transition-colors ${
          recording
            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
            : 'border-input bg-background'
        }`}
      >
        <Keyboard className="w-4 h-4 text-muted-foreground" />
        {recording ? (
          <span className="text-primary">Pressione a combinação...</span>
        ) : value ? (
          <span className="font-mono">{prettyCombo(value)}</span>
        ) : (
          <span className="text-muted-foreground">Clique e pressione um atalho</span>
        )}
      </button>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground"
          onClick={() => {
            onChange('');
            setRecording(false);
          }}
          title="Limpar atalho"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

const empty: UsefulLinkInput = { title: '', url: '', hotkey: '' };

function LinkFormDialog({
  open,
  onOpenChange,
  link,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  link?: UsefulLink | null;
}) {
  const { addLink, updateLink, usefulLinks } = useTimeTracker();
  const [form, setForm] = useState<UsefulLinkInput>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(link ? { title: link.title, url: link.url, hotkey: link.hotkey } : empty);
    }
  }, [open, link]);

  const normalizeUrl = (raw: string) => {
    const t = raw.trim();
    if (!t) return t;
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.trim()) {
      toast.error('Informe a URL do link');
      return;
    }
    if (form.hotkey) {
      const conflict = usefulLinks.find((l) => l.hotkey === form.hotkey && l.id !== link?.id);
      if (conflict) {
        toast.error(`O atalho ${prettyCombo(form.hotkey)} já é usado por "${conflict.title || conflict.url}"`);
        return;
      }
    }

    const payload: UsefulLinkInput = { ...form, url: normalizeUrl(form.url) };
    setSaving(true);
    const result = link ? await updateLink(link.id, payload) : await addLink(payload);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(link ? 'Link atualizado!' : 'Link adicionado!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{link ? 'Editar link' : 'Novo link útil'}</DialogTitle>
          <DialogDescription>
            Associe um atalho de teclado para abrir o link rapidamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkTitle">Título</Label>
            <Input
              id="linkTitle"
              placeholder="Ex: Portal de chamados"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkUrl">URL *</Label>
            <Input
              id="linkUrl"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Atalho de teclado</Label>
            <HotkeyRecorder
              value={form.hotkey}
              onChange={(v) => setForm((f) => ({ ...f, hotkey: v }))}
            />
            <p className="text-xs text-muted-foreground">
              Use uma combinação com Ctrl, Alt ou Cmd para abrir o link de qualquer lugar.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : link ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsefulLinksPanel() {
  const { usefulLinks, deleteLink } = useTimeTracker();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<UsefulLink | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UsefulLink | null>(null);

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (link: UsefulLink) => {
    setSelected(link);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteLink(deleteTarget.id);
    toast.success('Link removido');
    setDeleteTarget(null);
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Links Úteis</h2>
            <p className="text-xs text-muted-foreground">
              Seus links com atalhos de teclado personalizados
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo link
        </Button>
      </div>

      {usefulLinks.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          Nenhum link cadastrado. Adicione o primeiro!
        </p>
      ) : (
        <div className="space-y-3">
          {usefulLinks.map((link) => (
            <div
              key={link.id}
              className="p-4 rounded-xl border border-border bg-card/40 transition-all hover:border-primary/30 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{link.title || link.url}</span>
                  {link.hotkey && (
                    <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-xs font-mono whitespace-nowrap">
                      {prettyCombo(link.hotkey)}
                    </kbd>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{link.url}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="Abrir"
                  onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" title="Editar" onClick={() => openEdit(link)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  title="Excluir"
                  onClick={() => setDeleteTarget(link)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <LinkFormDialog open={formOpen} onOpenChange={setFormOpen} link={selected} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover link?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title || deleteTarget?.url}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

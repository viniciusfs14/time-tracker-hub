import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
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
import { Avatar as AvatarRoot, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function ProfileDialog({ open, onOpenChange }: Props) {
  const { user, updateAvatar, removeAvatar, updateName } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  if (!user) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    setUploading(true);
    const { error } = await updateAvatar(file);
    setUploading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Foto de perfil atualizada!');
  };

  const handleRemove = async () => {
    setUploading(true);
    const { error } = await removeAvatar();
    setUploading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Foto removida');
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error('Informe um nome');
      return;
    }
    setSavingName(true);
    const { error } = await updateName(name.trim());
    setSavingName(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Nome atualizado!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
          <DialogDescription>Personalize sua foto e seu nome.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative">
            <AvatarRoot className="w-24 h-24 border-2 border-primary/20">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </AvatarRoot>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow hover:opacity-90 disabled:opacity-50"
              title="Trocar foto"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          {user.avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              disabled={uploading}
            >
              <Trash2 className="w-4 h-4" /> Remover foto
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profileName">Nome</Label>
          <div className="flex gap-2">
            <Input
              id="profileName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
            <Button onClick={handleSaveName} disabled={savingName || name.trim() === user.name}>
              {savingName ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

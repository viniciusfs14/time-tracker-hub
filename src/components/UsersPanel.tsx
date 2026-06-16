import { useCallback, useEffect, useState } from 'react';
import { Shield, ShieldCheck, User as UserIcon, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ManagedUser {
  id: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export function UsersPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, name, avatar_url'),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    const adminIds = new Set((roles ?? []).filter((r) => r.role === 'admin').map((r) => r.user_id));
    const mapped = await Promise.all(
      (profiles ?? []).map(async (p: { id: string; name: string; avatar_url?: string | null }) => {
        let avatarUrl: string | undefined;
        if (p.avatar_url) {
          const { data } = await supabase.storage
            .from('avatars')
            .createSignedUrl(p.avatar_url, 60 * 60);
          avatarUrl = data?.signedUrl;
        }
        return { id: p.id, name: p.name, avatarUrl, isAdmin: adminIds.has(p.id) };
      })
    );
    mapped.sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.name.localeCompare(b.name));
    setUsers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAdmin = async (target: ManagedUser) => {
    setBusyId(target.id);
    if (target.isAdmin) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', target.id)
        .eq('role', 'admin');
      if (error) toast.error('Não foi possível remover o administrador');
      else toast.success(`${target.name} agora é funcionário`);
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: target.id, role: 'admin' });
      if (error) toast.error('Não foi possível promover a administrador');
      else toast.success(`${target.name} agora é administrador`);
    }
    setBusyId(null);
    await load();
  };

  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Gestão de usuários
          </h3>
          <p className="text-sm text-muted-foreground">
            Conceda ou remova privilégios de administrador.
          </p>
        </div>
        <Input
          placeholder="Buscar usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-56"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {u.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {u.name}
                    {u.id === user?.id && <span className="text-muted-foreground"> (você)</span>}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'gap-1 mt-0.5',
                      u.isAdmin
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'text-muted-foreground'
                    )}
                  >
                    {u.isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    {u.isAdmin ? 'Administrador' : 'Funcionário'}
                  </Badge>
                </div>
              </div>
              <Button
                variant={u.isAdmin ? 'outline' : 'default'}
                size="sm"
                disabled={busyId === u.id}
                onClick={() => toggleAdmin(u)}
                className="shrink-0 gap-2"
              >
                {busyId === u.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : u.isAdmin ? (
                  'Remover admin'
                ) : (
                  'Tornar admin'
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { StickyNote, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
}

export function NotesPanel() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .select('id, title, content')
      .order('updated_at', { ascending: false });
    if (data) {
      setNotes(data);
      if (data.length > 0) {
        setSelectedId((prev) => prev ?? data[0].id);
        if (!selectedId) {
          setTitle(data[0].title);
          setContent(data[0].content);
        }
      }
    }
  }, [user, selectedId]);

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createNewNote = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title: 'Nova anotação', content: '' })
      .select('id, title, content')
      .single();
    if (error || !data) {
      toast.error('Erro ao criar anotação');
      return;
    }
    setNotes((prev) => [data, ...prev]);
    selectNote(data);
  };

  const saveNote = async () => {
    if (!selectedId) return;
    setSaving(true);
    const { error } = await supabase
      .from('notes')
      .update({ title, content })
      .eq('id', selectedId);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar');
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === selectedId ? { ...n, title, content } : n)));
    toast.success('Anotação salva!');
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) {
      toast.error('Erro ao excluir');
      return;
    }
    const remaining = notes.filter((n) => n.id !== noteId);
    setNotes(remaining);
    if (selectedId === noteId) {
      if (remaining.length > 0) {
        selectNote(remaining[0]);
      } else {
        setSelectedId(null);
        setTitle('');
        setContent('');
      }
    }
    toast.success('Anotação excluída!');
  };

  const selectNote = (note: Note) => {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  return (
    <Card className="glass-card card-hover h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="w-5 h-5 text-primary" />
            Minhas Anotações
          </CardTitle>
          <Button size="sm" onClick={createNewNote}>
            + Nova
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma anotação ainda</p>
            <Button className="mt-4" onClick={createNewNote}>
              Criar primeira anotação
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Notes list */}
            <div className="space-y-2 lg:col-span-1 max-h-[300px] overflow-y-auto pr-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedId === note.id
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {note.content || 'Sem conteúdo'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Editor */}
            {selectedId && (
              <div className="lg:col-span-2 space-y-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da anotação"
                  className="font-medium"
                />
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva suas anotações aqui..."
                  className="min-h-[200px] resize-none"
                />
                <div className="flex justify-end">
                  <Button onClick={saveNote} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

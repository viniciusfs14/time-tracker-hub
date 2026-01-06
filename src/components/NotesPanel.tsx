import { useState, useEffect } from 'react';
import { StickyNote, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'timetracker_notes';

export function NotesPanel() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotes(parsed);
      if (parsed.length > 0 && !selectedNote) {
        setSelectedNote(parsed[0]);
        setTitle(parsed[0].title);
        setContent(parsed[0].content);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(notes));
  }, [notes, user]);

  const createNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Nova anotação',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
    setTitle(newNote.title);
    setContent(newNote.content);
  };

  const saveNote = () => {
    if (!selectedNote) return;
    
    setNotes(prev => prev.map(n => 
      n.id === selectedNote.id 
        ? { ...n, title, content, updatedAt: new Date().toISOString() }
        : n
    ));
    setSelectedNote(prev => prev ? { ...prev, title, content } : null);
    toast.success('Anotação salva!');
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (selectedNote?.id === noteId) {
      const remaining = notes.filter(n => n.id !== noteId);
      if (remaining.length > 0) {
        setSelectedNote(remaining[0]);
        setTitle(remaining[0].title);
        setContent(remaining[0].content);
      } else {
        setSelectedNote(null);
        setTitle('');
        setContent('');
      }
    }
    toast.success('Anotação excluída!');
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
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
              {notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedNote?.id === note.id
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
            {selectedNote && (
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
                  <Button onClick={saveNote} className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar
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

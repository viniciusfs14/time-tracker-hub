import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Bell,
  Users,
  MapPin,
  Trash2,
  Pencil,
  Clock,
  Globe,
  Link2,
  Loader2,
  RefreshCw,
  Unplug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { CalendarEvent, CalendarEventType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MS_COLOR = 'hsl(238 47% 57%)'; // Microsoft Teams purple-blue

interface DisplayEvent extends CalendarEvent {
  external?: boolean;
  webLink?: string;
}


const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const EVENT_COLORS = [
  { label: 'Roxo', value: 'hsl(280 75% 55%)' },
  { label: 'Azul', value: 'hsl(217 91% 60%)' },
  { label: 'Verde', value: 'hsl(142 71% 45%)' },
  { label: 'Laranja', value: 'hsl(25 95% 53%)' },
  { label: 'Vermelho', value: 'hsl(0 84% 60%)' },
  { label: 'Rosa', value: 'hsl(330 81% 60%)' },
];

const pad = (n: number) => n.toString().padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isSameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);

const mapEvent = (r: any): CalendarEvent => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  description: r.description ?? '',
  eventType: (r.event_type as CalendarEventType) ?? 'reminder',
  location: r.location ?? '',
  startAt: r.start_at,
  endAt: r.end_at ?? null,
  allDay: !!r.all_day,
  shared: !!r.shared,
  color: r.color ?? '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const colorFor = (e: CalendarEvent) =>
  e.color || (e.eventType === 'meeting' ? 'hsl(217 91% 60%)' : 'hsl(280 75% 55%)');

const formatHour = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

interface EventFormState {
  id: string | null;
  title: string;
  description: string;
  eventType: CalendarEventType;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  shared: boolean;
  color: string;
}

const emptyForm = (date: Date): EventFormState => ({
  id: null,
  title: '',
  description: '',
  eventType: 'reminder',
  location: '',
  date: dateKey(date),
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  shared: false,
  color: EVENT_COLORS[0].value,
});

export function CalendarPanel() {
  const { user } = useAuth();
  const { getProfileName } = useTimeTracker();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(() => emptyForm(new Date()));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_at', { ascending: true });
    setEvents((data ?? []).map(mapEvent));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const key = dateKey(new Date(e.startAt));
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    });
    map.forEach((arr) =>
      arr.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    );
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(dateKey(selectedDay)) ?? [];
  const today = new Date();

  const openCreate = (date: Date) => {
    setForm(emptyForm(date));
    setDialogOpen(true);
  };

  const openEdit = (e: CalendarEvent) => {
    const start = new Date(e.startAt);
    const end = e.endAt ? new Date(e.endAt) : null;
    setForm({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      location: e.location,
      date: dateKey(start),
      startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      endTime: end ? `${pad(end.getHours())}:${pad(end.getMinutes())}` : '10:00',
      allDay: e.allDay,
      shared: e.shared,
      color: colorFor(e),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error('Informe um título');
      return;
    }
    setSaving(true);
    const startISO = form.allDay
      ? new Date(`${form.date}T00:00`).toISOString()
      : new Date(`${form.date}T${form.startTime}`).toISOString();
    const endISO = form.allDay
      ? null
      : new Date(`${form.date}T${form.endTime}`).toISOString();

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description,
      event_type: form.eventType,
      location: form.location,
      start_at: startISO,
      end_at: endISO,
      all_day: form.allDay,
      shared: form.shared,
      color: form.color,
    };

    const { error } = form.id
      ? await supabase.from('calendar_events').update(payload).eq('id', form.id)
      : await supabase.from('calendar_events').insert(payload);

    setSaving(false);
    if (error) {
      toast.error('Não foi possível salvar o evento');
      return;
    }
    toast.success(form.id ? 'Evento atualizado' : 'Evento criado');
    setDialogOpen(false);
    setSelectedDay(new Date(`${form.date}T00:00`));
    await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id);
    toast.success('Evento removido');
    setDialogOpen(false);
    await load();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 animate-fade-in">
      {/* Calendar */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold capitalize">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button size="sm" className="gap-2" onClick={() => openCreate(selectedDay)}>
              <Plus className="w-4 h-4" /> Novo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const dayEvents = eventsByDay.get(dateKey(d)) ?? [];
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, selectedDay);
            return (
              <button
                key={dateKey(d)}
                onClick={() => setSelectedDay(d)}
                onDoubleClick={() => openCreate(d)}
                className={cn(
                  'min-h-[78px] rounded-lg border p-1.5 text-left transition-colors flex flex-col gap-1',
                  inMonth ? 'bg-card/40 border-border' : 'bg-muted/20 border-transparent text-muted-foreground',
                  isSelected && 'ring-2 ring-primary border-primary/40',
                  'hover:border-primary/40'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {d.getDate()}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="flex items-center gap-1 text-[10px] leading-tight truncate rounded px-1 py-0.5 text-foreground/90"
                      style={{ backgroundColor: `${colorFor(e)}22` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colorFor(e) }} />
                      <span className="truncate">
                        {!e.allDay && `${formatHour(e.startAt)} `}
                        {e.title}
                      </span>
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} mais</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      <div className="glass-card rounded-2xl p-5 h-fit">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {WEEKDAYS[selectedDay.getDay()]}
            </p>
            <h3 className="text-lg font-semibold">
              {selectedDay.getDate()} de {MONTHS[selectedDay.getMonth()]}
            </h3>
          </div>
          <Button size="icon" variant="ghost" onClick={() => openCreate(selectedDay)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum evento neste dia. Clique em “+” para adicionar.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((e) => {
              const mine = e.userId === user?.id;
              return (
                <button
                  key={e.id}
                  onClick={() => mine && openEdit(e)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border border-border bg-card/40 transition-colors',
                    mine && 'hover:border-primary/40 cursor-pointer'
                  )}
                  style={{ borderLeft: `3px solid ${colorFor(e)}` }}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      {e.eventType === 'meeting' ? <Users className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                      {e.eventType === 'meeting' ? 'Reunião' : 'Lembrete'}
                    </Badge>
                    {e.shared && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Globe className="w-3 h-3" /> Compartilhado
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {e.allDay ? 'Dia inteiro' : `${formatHour(e.startAt)}${e.endAt ? ` – ${formatHour(e.endAt)}` : ''}`}
                  </p>
                  {e.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {e.location}
                    </p>
                  )}
                  {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                  {!mine && (
                    <p className="text-[10px] text-muted-foreground mt-1">por {getProfileName(e.userId)}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Event dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar evento' : 'Novo evento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Reunião de alinhamento"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.eventType}
                  onValueChange={(v: CalendarEventType) => setForm({ ...form, eventType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Lembrete</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex items-center gap-2 h-10">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setForm({ ...form, color: c.value })}
                      className={cn(
                        'w-6 h-6 rounded-full transition-transform',
                        form.color === c.value && 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="cursor-pointer">Dia inteiro</Label>
              <Switch
                checked={form.allDay}
                onCheckedChange={(v) => setForm({ ...form, allDay: v })}
              />
            </div>

            {!form.allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Local / Link</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Sala, Teams, Meet..."
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="cursor-pointer">Compartilhar com a equipe</Label>
                <p className="text-xs text-muted-foreground">Fica visível para todos os usuários</p>
              </div>
              <Switch
                checked={form.shared}
                onCheckedChange={(v) => setForm({ ...form, shared: v })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {form.id && (
              <Button
                variant="ghost"
                className="mr-auto text-destructive hover:text-destructive gap-2"
                onClick={() => handleDelete(form.id!)}
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Pencil className="w-4 h-4" /> {form.id ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

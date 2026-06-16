import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { TimeEntry, RunningTimer, Ritm, RitmInput, RitmHistoryEntry, Profile, RitmStatusValue, LocalityValue, PimsValue, UsefulLink, UsefulLinkInput } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface TimeTrackerContextType {
  timers: RunningTimer[];
  entries: TimeEntry[];
  ritms: Ritm[];
  profiles: Profile[];
  usefulLinks: UsefulLink[];
  loading: boolean;
  // timers
  addTimer: (activity?: string, ritmCode?: string, opts?: { urgent?: boolean }) => string;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  stopTimer: (id: string) => Promise<void>;
  removeTimer: (id: string) => void;
  updateTimer: (id: string, data: { activity?: string; ritmCode?: string }) => void;
  togglePin: (id: string) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  // manual
  addManualEntry: (activity: string, startTime: string, endTime: string, ritmCode?: string) => Promise<void>;
  // ritms
  createRitm: (data: RitmInput) => Promise<{ error?: string }>;
  updateRitm: (id: string, data: RitmInput) => Promise<{ error?: string }>;
  setRitmArchived: (id: string, archived: boolean) => Promise<void>;
  deleteRitm: (id: string) => Promise<void>;
  getRitmHistory: (ritmId: string) => Promise<RitmHistoryEntry[]>;
  // useful links
  addLink: (data: UsefulLinkInput) => Promise<{ error?: string }>;
  updateLink: (id: string, data: UsefulLinkInput) => Promise<{ error?: string }>;
  deleteLink: (id: string) => Promise<void>;
  // stats
  getTodayTotal: () => number;
  getEntriesByPeriod: (days: number) => TimeEntry[];
  getUserEntries: (userId?: string) => TimeEntry[];
  getProfileName: (userId: string) => string;
  getRitmTotalTime: (code: string) => number;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

const STORAGE_KEY_TIMERS = 'timetracker_timers';

const mapEntry = (r: any): TimeEntry => ({
  id: r.id,
  userId: r.user_id,
  activity: r.activity,
  ritmCode: r.ritm_code ?? undefined,
  startTime: r.start_time,
  endTime: r.end_time ?? undefined,
  duration: r.duration,
  date: r.date,
  type: r.type === 'manual' ? 'manual' : 'timer',
});

const mapRitm = (r: any): Ritm => ({
  id: r.id,
  userId: r.user_id,
  code: r.code,
  title: r.title ?? '',
  description: r.description ?? '',
  requester: r.requester ?? '',
  category: r.category ?? '',
  status: (r.status as RitmStatusValue) ?? 'open',
  pendingReason: r.pending_reason ?? '',
  requestType: r.request_type ?? '',
  operationalUnit: r.operational_unit ?? '',
  requesterEmail: r.requester_email ?? '',
  locality: (r.locality as LocalityValue) ?? '',
  pims: (r.pims as PimsValue) ?? '',
  pep: r.pep ?? '',
  observation: r.observation ?? '',
  archived: !!r.archived,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapLink = (r: any): UsefulLink => ({
  id: r.id,
  userId: r.user_id,
  title: r.title ?? '',
  url: r.url,
  hotkey: r.hotkey ?? '',
  createdAt: r.created_at,
});

const localId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const FIELD_LABELS: Record<string, string> = {
  code: 'Item requisitado',
  title: 'Título',
  description: 'Descrição',
  requester: 'Solicitante',
  category: 'Categoria',
  status: 'Status',
  pendingReason: 'Motivo da pendência',
  requestType: 'Tipo de solicitação',
  operationalUnit: 'Unidade Operacional',
  requesterEmail: 'Email do solicitante',
  locality: 'Localidade',
  pims: 'PIMS',
  pep: 'PEP',
  observation: 'Observação',
  created: 'Chamado',
  archived: 'Arquivamento',
};

const toRow = (data: RitmInput) => ({
  code: data.code.trim(),
  title: data.title,
  description: data.description,
  requester: data.requester,
  category: data.category,
  status: data.status,
  pending_reason: data.status === 'pending' ? data.pendingReason : '',
  request_type: data.requestType,
  operational_unit: data.operationalUnit,
  requester_email: data.requesterEmail,
  locality: data.locality,
  pims: data.pims,
  pep: data.pep,
  observation: data.observation,
});

const TRACKED_FIELDS: (keyof RitmInput)[] = [
  'code',
  'title',
  'description',
  'requester',
  'category',
  'status',
  'pendingReason',
  'requestType',
  'operationalUnit',
  'requesterEmail',
  'locality',
  'pims',
  'pep',
  'observation',
];

export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [ritms, setRitms] = useState<Ritm[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(false);

  const [timers, setTimers] = useState<RunningTimer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIMERS);
    try {
      return saved ? (JSON.parse(saved) as RunningTimer[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIMERS, JSON.stringify(timers));
  }, [timers]);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setRitms([]);
      setProfiles([]);
      setUsefulLinks([]);
      return;
    }
    setLoading(true);
    const [entriesRes, ritmsRes, profilesRes, linksRes] = await Promise.all([
      supabase.from('time_entries').select('*').order('start_time', { ascending: false }),
      supabase.from('ritms').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, avatar_url'),
      supabase.from('useful_links').select('*').order('created_at', { ascending: false }),
    ]);

    if (entriesRes.data) setEntries(entriesRes.data.map(mapEntry));
    if (ritmsRes.data) setRitms(ritmsRes.data.map(mapRitm));
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (linksRes.data) setUsefulLinks(linksRes.data.map(mapLink));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---------- Timers ----------
  const addTimer = useCallback((activity = '', ritmCode = '', opts?: { urgent?: boolean }) => {
    const id = localId();
    setTimers((prev) => [
      ...prev,
      {
        id,
        activity: activity || (opts?.urgent ? 'Atividade urgente' : ''),
        ritmCode: ritmCode || '',
        status: 'running',
        startTime: Date.now(),
        accumulatedTime: 0,
        createdAt: Date.now(),
        urgent: opts?.urgent,
      },
    ]);
    return id;
  }, []);

  const pauseTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id && t.status === 'running'
          ? {
              ...t,
              status: 'paused',
              accumulatedTime: t.accumulatedTime + (Date.now() - (t.startTime || Date.now())),
              startTime: null,
            }
          : t
      )
    );
  }, []);

  const resumeTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id && t.status === 'paused'
          ? { ...t, status: 'running', startTime: Date.now() }
          : t
      )
    );
  }, []);

  const pauseAll = useCallback(() => {
    setTimers((prev) =>
      prev.map((t) =>
        t.status === 'running'
          ? {
              ...t,
              status: 'paused',
              accumulatedTime: t.accumulatedTime + (Date.now() - (t.startTime || Date.now())),
              startTime: null,
            }
          : t
      )
    );
  }, []);

  const resumeAll = useCallback(() => {
    setTimers((prev) =>
      prev.map((t) =>
        t.status === 'paused' ? { ...t, status: 'running', startTime: Date.now() } : t
      )
    );
  }, []);

  const updateTimer = useCallback((id: string, data: { activity?: string; ritmCode?: string }) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              activity: data.activity ?? t.activity,
              ritmCode: data.ritmCode ?? t.ritmCode,
            }
          : t
      )
    );
  }, []);

  const togglePin = useCallback((id: string) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cria automaticamente um chamado quando um RITM é associado a um registro,
  // caso ainda não exista um chamado com esse código para o usuário.
  const ensureRitm = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || !user) return;
      const { data: existing } = await supabase
        .from('ritms')
        .select('id')
        .eq('user_id', user.id)
        .ilike('code', trimmed)
        .limit(1);
      if (existing && existing.length > 0) return;

      const { data: inserted } = await supabase
        .from('ritms')
        .insert({ user_id: user.id, code: trimmed, status: 'open' })
        .select()
        .single();
      if (inserted) {
        await supabase.from('ritm_history').insert({
          ritm_id: inserted.id,
          user_id: user.id,
          field: 'created',
          old_value: null,
          new_value: trimmed,
        });
      }
    },
    [user]
  );

  const stopTimer = useCallback(
    async (id: string) => {
      const t = timers.find((x) => x.id === id);
      if (!t || !user) {
        removeTimer(id);
        return;
      }

      const totalMs =
        t.status === 'running'
          ? t.accumulatedTime + (Date.now() - (t.startTime || Date.now()))
          : t.accumulatedTime;

      const now = new Date();
      removeTimer(id);

      const duration = Math.floor(totalMs / 1000);
      if (duration <= 0) return;

      await supabase.from('time_entries').insert({
        user_id: user.id,
        activity: t.activity || 'Atividade sem nome',
        ritm_code: t.ritmCode || null,
        start_time: new Date(now.getTime() - totalMs).toISOString(),
        end_time: now.toISOString(),
        duration,
        date: now.toISOString().split('T')[0],
        type: 'timer',
      });

      if (t.ritmCode) await ensureRitm(t.ritmCode);

      await refresh();
    },
    [timers, user, refresh, removeTimer, ensureRitm]
  );

  const addManualEntry = useCallback(
    async (activity: string, startTime: string, endTime: string, ritmCode?: string) => {
      if (!user) return;

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date();
      endDate.setHours(endHour, endMin, 0, 0);

      const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
      if (duration <= 0) return;

      await supabase.from('time_entries').insert({
        user_id: user.id,
        activity,
        ritm_code: ritmCode || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration,
        date: new Date().toISOString().split('T')[0],
        type: 'manual',
      });

      if (ritmCode) await ensureRitm(ritmCode);

      await refresh();
    },
    [user, refresh, ensureRitm]
  );

  // ---------- RITMs ----------
  const logHistory = useCallback(
    async (ritmId: string, rows: { field: string; oldValue: string | null; newValue: string | null }[]) => {
      if (!user || rows.length === 0) return;
      await supabase.from('ritm_history').insert(
        rows.map((r) => ({
          ritm_id: ritmId,
          user_id: user.id,
          field: r.field,
          old_value: r.oldValue,
          new_value: r.newValue,
        }))
      );
    },
    [user]
  );

  const createRitm = useCallback(
    async (data: RitmInput) => {
      if (!user) return { error: 'Não autenticado' };
      const { data: inserted, error } = await supabase
        .from('ritms')
        .insert({ user_id: user.id, ...toRow(data) })
        .select()
        .single();

      if (error) return { error: error.message };
      if (inserted) {
        await logHistory(inserted.id, [
          { field: 'created', oldValue: null, newValue: data.code.trim() },
        ]);
      }
      await refresh();
      return {};
    },
    [user, refresh, logHistory]
  );

  const updateRitm = useCallback(
    async (id: string, data: RitmInput) => {
      if (!user) return { error: 'Não autenticado' };
      const current = ritms.find((r) => r.id === id);

      const normalized: RitmInput = {
        ...data,
        code: data.code.trim(),
        pendingReason: data.status === 'pending' ? data.pendingReason : '',
      };

      const { error } = await supabase.from('ritms').update(toRow(normalized)).eq('id', id);

      if (error) return { error: error.message };

      if (current) {
        const changes = TRACKED_FIELDS
          .filter((f) => (current[f] ?? '') !== (normalized[f] ?? ''))
          .map((f) => ({
            field: f,
            oldValue: String(current[f] ?? ''),
            newValue: String(normalized[f] ?? ''),
          }));
        await logHistory(id, changes);
      }
      await refresh();
      return {};
    },
    [user, ritms, refresh, logHistory]
  );

  const setRitmArchived = useCallback(
    async (id: string, archived: boolean) => {
      if (!user) return;
      await supabase.from('ritms').update({ archived }).eq('id', id);
      await logHistory(id, [
        { field: 'archived', oldValue: String(!archived), newValue: String(archived) },
      ]);
      await refresh();
    },
    [user, refresh, logHistory]
  );

  const deleteRitm = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from('ritms').delete().eq('id', id);
      await refresh();
    },
    [user, refresh]
  );

  const getRitmHistory = useCallback(async (ritmId: string): Promise<RitmHistoryEntry[]> => {
    const { data } = await supabase
      .from('ritm_history')
      .select('*')
      .eq('ritm_id', ritmId)
      .order('created_at', { ascending: false });
    return (data ?? []).map((r) => ({
      id: r.id,
      ritmId: r.ritm_id,
      userId: r.user_id,
      field: FIELD_LABELS[r.field] || r.field,
      oldValue: r.old_value,
      newValue: r.new_value,
      createdAt: r.created_at,
    }));
  }, []);

  // ---------- Useful links ----------
  const addLink = useCallback(
    async (data: UsefulLinkInput) => {
      if (!user) return { error: 'Não autenticado' };
      const { error } = await supabase.from('useful_links').insert({
        user_id: user.id,
        title: data.title,
        url: data.url,
        hotkey: data.hotkey,
      });
      if (error) return { error: error.message };
      await refresh();
      return {};
    },
    [user, refresh]
  );

  const updateLink = useCallback(
    async (id: string, data: UsefulLinkInput) => {
      if (!user) return { error: 'Não autenticado' };
      const { error } = await supabase
        .from('useful_links')
        .update({ title: data.title, url: data.url, hotkey: data.hotkey })
        .eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return {};
    },
    [user, refresh]
  );

  const deleteLink = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from('useful_links').delete().eq('id', id);
      await refresh();
    },
    [user, refresh]
  );

  // ---------- Stats ----------
  const getTodayTotal = useCallback(() => {
    if (!user) return 0;
    const today = new Date().toISOString().split('T')[0];
    return entries
      .filter((e) => e.userId === user.id && e.date === today)
      .reduce((sum, e) => sum + e.duration, 0);
  }, [entries, user]);

  const getEntriesByPeriod = useCallback(
    (days: number) => {
      if (!user) return [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return entries.filter((e) => e.userId === user.id && new Date(e.date) >= cutoff);
    },
    [entries, user]
  );

  const getUserEntries = useCallback(
    (userId?: string) => {
      if (userId) return entries.filter((e) => e.userId === userId);
      return entries;
    },
    [entries]
  );

  const getProfileName = useCallback(
    (userId: string) => profiles.find((p) => p.id === userId)?.name || userId.slice(0, 8),
    [profiles]
  );

  const getRitmTotalTime = useCallback(
    (code: string) => {
      if (!user) return 0;
      return entries
        .filter((e) => e.userId === user.id && (e.ritmCode || '').toUpperCase() === code.toUpperCase())
        .reduce((sum, e) => sum + e.duration, 0);
    },
    [entries, user]
  );

  return (
    <TimeTrackerContext.Provider
      value={{
        timers,
        entries,
        ritms,
        profiles,
        usefulLinks,
        loading,
        addTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        removeTimer,
        updateTimer,
        pauseAll,
        resumeAll,
        addManualEntry,
        createRitm,
        updateRitm,
        setRitmArchived,
        deleteRitm,
        getRitmHistory,
        addLink,
        updateLink,
        deleteLink,
        getTodayTotal,
        getEntriesByPeriod,
        getUserEntries,
        getProfileName,
        getRitmTotalTime,
      }}
    >
      {children}
    </TimeTrackerContext.Provider>
  );
}

export function useTimeTracker() {
  const context = useContext(TimeTrackerContext);
  if (!context) {
    throw new Error('useTimeTracker must be used within TimeTrackerProvider');
  }
  return context;
}

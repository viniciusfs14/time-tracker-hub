import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { TimeEntry, TimerState, RitmStatus, Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface TimeTrackerContextType {
  timer: TimerState;
  entries: TimeEntry[];
  ritmStatuses: RitmStatus[];
  profiles: Profile[];
  loading: boolean;
  startTimer: (activity: string, ritmCode?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  addManualEntry: (activity: string, startTime: string, endTime: string, ritmCode?: string) => Promise<void>;
  updateRitmStatus: (code: string, status: 'open' | 'closed') => Promise<void>;
  getTodayTotal: () => number;
  getEntriesByPeriod: (days: number) => TimeEntry[];
  getUserEntries: (userId?: string) => TimeEntry[];
  getProfileName: (userId: string) => string;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

const STORAGE_KEY_TIMER = 'timetracker_timer';

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

export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [ritmStatuses, setRitmStatuses] = useState<RitmStatus[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState<TimerState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIMER);
    return saved ? JSON.parse(saved) : {
      status: 'stopped',
      startTime: null,
      accumulatedTime: 0,
      currentActivity: '',
      ritmCode: '',
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIMER, JSON.stringify(timer));
  }, [timer]);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setRitmStatuses([]);
      setProfiles([]);
      return;
    }
    setLoading(true);
    const [entriesRes, ritmRes, profilesRes] = await Promise.all([
      supabase.from('time_entries').select('*').order('start_time', { ascending: false }),
      supabase.from('ritm_statuses').select('*'),
      supabase.from('profiles').select('id, name'),
    ]);

    if (entriesRes.data) setEntries(entriesRes.data.map(mapEntry));
    if (ritmRes.data) {
      setRitmStatuses(
        ritmRes.data.map((r) => ({
          code: r.code,
          status: r.status === 'closed' ? 'closed' : 'open',
          totalTime: r.total_time,
        }))
      );
    }
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startTimer = useCallback((activity: string, ritmCode?: string) => {
    setTimer({
      status: 'running',
      startTime: Date.now(),
      accumulatedTime: 0,
      currentActivity: activity,
      ritmCode: ritmCode || '',
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      status: 'paused',
      accumulatedTime: prev.accumulatedTime + (Date.now() - (prev.startTime || Date.now())),
      startTime: null,
    }));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      status: 'running',
      startTime: Date.now(),
    }));
  }, []);

  const stopTimer = useCallback(async () => {
    if (!user) return;

    const totalTime = timer.status === 'running'
      ? timer.accumulatedTime + (Date.now() - (timer.startTime || Date.now()))
      : timer.accumulatedTime;

    const now = new Date();

    setTimer({
      status: 'stopped',
      startTime: null,
      accumulatedTime: 0,
      currentActivity: '',
      ritmCode: '',
    });

    await supabase.from('time_entries').insert({
      user_id: user.id,
      activity: timer.currentActivity,
      ritm_code: timer.ritmCode || null,
      start_time: new Date(now.getTime() - totalTime).toISOString(),
      end_time: now.toISOString(),
      duration: Math.floor(totalTime / 1000),
      date: now.toISOString().split('T')[0],
      type: 'timer',
    });

    await refresh();
  }, [timer, user, refresh]);

  const addManualEntry = useCallback(async (activity: string, startTime: string, endTime: string, ritmCode?: string) => {
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

    await refresh();
  }, [user, refresh]);

  const updateRitmStatus = useCallback(async (code: string, status: 'open' | 'closed') => {
    if (!user) return;
    await supabase
      .from('ritm_statuses')
      .upsert({ user_id: user.id, code, status }, { onConflict: 'user_id,code' });
    await refresh();
  }, [user, refresh]);

  const getTodayTotal = useCallback(() => {
    if (!user) return 0;
    const today = new Date().toISOString().split('T')[0];
    return entries
      .filter(e => e.userId === user.id && e.date === today)
      .reduce((sum, e) => sum + e.duration, 0);
  }, [entries, user]);

  const getEntriesByPeriod = useCallback((days: number) => {
    if (!user) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter(e =>
      e.userId === user.id && new Date(e.date) >= cutoff
    );
  }, [entries, user]);

  const getUserEntries = useCallback((userId?: string) => {
    if (userId) {
      return entries.filter(e => e.userId === userId);
    }
    return entries;
  }, [entries]);

  const getProfileName = useCallback((userId: string) => {
    return profiles.find(p => p.id === userId)?.name || userId.slice(0, 8);
  }, [profiles]);

  return (
    <TimeTrackerContext.Provider value={{
      timer,
      entries,
      ritmStatuses,
      profiles,
      loading,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      addManualEntry,
      updateRitmStatus,
      getTodayTotal,
      getEntriesByPeriod,
      getUserEntries,
      getProfileName,
    }}>
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

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { TimeEntry, TimerState, RitmStatus } from '@/types';
import { useAuth } from './AuthContext';

interface TimeTrackerContextType {
  timer: TimerState;
  entries: TimeEntry[];
  ritmStatuses: RitmStatus[];
  startTimer: (activity: string, ritmCode?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  addManualEntry: (activity: string, startTime: string, endTime: string, ritmCode?: string) => void;
  updateRitmStatus: (code: string, status: 'open' | 'closed') => void;
  getTodayTotal: () => number;
  getEntriesByPeriod: (days: number) => TimeEntry[];
  getUserEntries: (userId?: string) => TimeEntry[];
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

const STORAGE_KEY_ENTRIES = 'timetracker_entries';
const STORAGE_KEY_TIMER = 'timetracker_timer';
const STORAGE_KEY_RITM = 'timetracker_ritm';

export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ENTRIES);
    return saved ? JSON.parse(saved) : [];
  });

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

  const [ritmStatuses, setRitmStatuses] = useState<RitmStatus[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RITM);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIMER, JSON.stringify(timer));
  }, [timer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RITM, JSON.stringify(ritmStatuses));
  }, [ritmStatuses]);

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

  const stopTimer = useCallback(() => {
    if (!user) return;

    const totalTime = timer.status === 'running'
      ? timer.accumulatedTime + (Date.now() - (timer.startTime || Date.now()))
      : timer.accumulatedTime;

    const entry: TimeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      activity: timer.currentActivity,
      ritmCode: timer.ritmCode || undefined,
      startTime: new Date(),
      endTime: new Date(),
      duration: Math.floor(totalTime / 1000),
      date: new Date().toISOString().split('T')[0],
      type: 'timer',
    };

    setEntries(prev => [...prev, entry]);
    setTimer({
      status: 'stopped',
      startTime: null,
      accumulatedTime: 0,
      currentActivity: '',
      ritmCode: '',
    });
  }, [timer, user]);

  const addManualEntry = useCallback((activity: string, startTime: string, endTime: string, ritmCode?: string) => {
    if (!user) return;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMin, 0);
    
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    
    if (duration <= 0) return;

    const entry: TimeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      activity,
      ritmCode,
      startTime: startDate,
      endTime: endDate,
      duration,
      date: new Date().toISOString().split('T')[0],
      type: 'manual',
    };

    setEntries(prev => [...prev, entry]);
  }, [user]);

  const updateRitmStatus = useCallback((code: string, status: 'open' | 'closed') => {
    setRitmStatuses(prev => {
      const existing = prev.find(r => r.code === code);
      if (existing) {
        return prev.map(r => r.code === code ? { ...r, status } : r);
      }
      return [...prev, { code, status, totalTime: 0 }];
    });
  }, []);

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

  return (
    <TimeTrackerContext.Provider value={{
      timer,
      entries,
      ritmStatuses,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      addManualEntry,
      updateRitmStatus,
      getTodayTotal,
      getEntriesByPeriod,
      getUserEntries,
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

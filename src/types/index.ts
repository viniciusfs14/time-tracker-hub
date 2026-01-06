export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  activity: string;
  ritmCode?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  date: string;
  type: 'timer' | 'manual';
}

export interface RitmStatus {
  code: string;
  status: 'open' | 'closed';
  totalTime: number;
}

export type TimerStatus = 'stopped' | 'running' | 'paused';

export interface TimerState {
  status: TimerStatus;
  startTime: number | null;
  accumulatedTime: number;
  currentActivity: string;
  ritmCode: string;
}

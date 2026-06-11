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
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  date: string;
  type: 'timer' | 'manual';
}

export interface Profile {
  id: string;
  name: string;
}

export type RitmStatusValue = 'open' | 'pending' | 'closed';

export interface Ritm {
  id: string;
  userId: string;
  code: string;
  title: string;
  description: string;
  requester: string;
  category: string;
  status: RitmStatusValue;
  pendingReason: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RitmHistoryEntry {
  id: string;
  ritmId: string;
  userId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export type RitmInput = {
  code: string;
  title: string;
  description: string;
  requester: string;
  category: string;
  status: RitmStatusValue;
  pendingReason: string;
};

export type TimerStatus = 'running' | 'paused';

export interface RunningTimer {
  id: string; // local id
  activity: string;
  ritmCode: string;
  status: TimerStatus;
  startTime: number | null; // ms epoch when running
  accumulatedTime: number; // ms
  createdAt: number;
  urgent?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  avatar?: string;
  avatarUrl?: string;
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
  avatarUrl?: string | null;
}

export type RitmStatusValue = 'open' | 'pending' | 'closed';

export type LocalityValue = '' | 'Salobo/Sossego' | 'Ferrosos';
export type PimsValue = '' | 'PI System Sul/Sudeste' | 'PI System Vitória';

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
  requestType: string;
  operationalUnit: string;
  requesterEmail: string;
  locality: LocalityValue;
  pims: PimsValue;
  pep: string;
  observation: string;
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
  requestType: string;
  operationalUnit: string;
  requesterEmail: string;
  locality: LocalityValue;
  pims: PimsValue;
  pep: string;
  observation: string;
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

export interface UsefulLink {
  id: string;
  userId: string;
  title: string;
  url: string;
  hotkey: string;
  createdAt: string;
}

export type UsefulLinkInput = {
  title: string;
  url: string;
  hotkey: string;
};

export type CalendarEventType = 'reminder' | 'meeting';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  eventType: CalendarEventType;
  location: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  shared: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventInput = {
  title: string;
  description: string;
  eventType: CalendarEventType;
  location: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  shared: boolean;
  color: string;
};

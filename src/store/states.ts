import { Auth0UserProfile } from 'auth0-js';
import { Schedule } from '@/api/schedule';
import { Event } from '@/api/event';
import { Hunt, MapPiece } from '@/api/hunt';

export interface AdminState {
  schedule: Schedule | null;
  events: Event[];
  colorNames: string[];
  modifierNames: string[];
  draftEvents: Event[];
}

export interface ScavengerState {
  hunts: Hunt[];
}

export interface AuthState {
  authenticated: boolean;
  accessToken: string | null;
  idToken: string | null;
  expiresAt: number;
  user: (Auth0UserProfile & {[index: string]: any}) | null;
  defaultView: string;
}

export interface RootState {
  schedules: Schedule[];
  showModal: boolean;
  modalEvent: Event | null;
  modalColor: string;
  curSchedule: number;
}

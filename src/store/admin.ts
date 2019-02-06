import { AdminState, RootState } from './states';
import { Module } from 'vuex';
import sched, { Schedule } from '@/api/schedule';
import event, { Event } from '@/api/event';

const adminModule: Module<AdminState, RootState> = {
  namespaced: true,
  state: {
    schedule: null,
    events: [],
  },
  getters: {
    sched(state) {
      return state.schedule;
    },
    events(state) {
      return state.events;
    },
  },
  mutations: {
    setSched(state: AdminState, payload: Schedule) {
      state.schedule = payload;
    },
    setEvents(state: AdminState, payload: Event[]) {
      state.events = payload;
    },
    updateEvent(state: AdminState, payload: Event) {
      const idx = state.events.findIndex((e) => e.id === payload.id);
      state.events.splice(idx, 1, payload);
    },
    removeEvent(state: AdminState, id: number) {
      const idx = state.events.findIndex((e) => e.id === id);
      state.events.splice(idx, 1);
    },
  },
  actions: {
    async loadSchedById({ commit }, id: number) {
      const s = await sched.getSchedule(id);
      commit('setSched', s);
      const e = await event.getEvents(id);
      commit('setEvents', e);
    },
    async updateSchedule({ commit }, payload: Schedule) {
      commit('setSched', payload);
      await payload.save();
    },
    async updateEvent({ commit }, payload: Event) {
      commit('updateEvent', payload);
      await payload.save();
    },
    async delEvent({ commit }, id: number) {
      commit('removeEvent', id);
      await event.delEvent(id);
    },
  },
};

export default adminModule;

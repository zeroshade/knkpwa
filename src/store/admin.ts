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
      if (idx !== -1) {
        state.events.splice(idx, 1, payload);
      } else {
        state.events.push(payload);
      }
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
    async updateSchedule({ commit, dispatch }, payload: Schedule) {
      commit('setSched', payload);
      await dispatch('auth/makeAuthedRequest', {
        path: `/scheds/${payload.id}`,
        method: 'PUT',
        body: payload.getISched(),
      }, { root: true });
    },
    async updateEvent({ commit, dispatch }, payload: Event) {
      commit('updateEvent', payload);
      const body = payload.getIEvent();
      let path = '/events';
      let method = 'POST';
      if (payload.id !== 0) {
        path += `/${payload.id}`;
        method = 'PUT';
      }

      await dispatch('auth/makeAuthedRequest', {
        path, method, body,
      }, { root: true });
    },
    async delEvent({ commit, dispatch }, id: number) {
      commit('removeEvent', id);
      await dispatch('auth/makeAuthedRequest', {
        path: `/events/${id}`,
        method: 'DELETE',
      }, { root: true });
    },
  },
};

export default adminModule;

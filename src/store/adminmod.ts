import { AdminState, RootState } from './states';
import { Module } from 'vuex';
import sched, { Schedule, ISchedule } from '@/api/schedule';
import event, { Event } from '@/api/event';
import colors from 'vuetify/es5/util/colors';

function camelCaseToDash(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([0-9])([^0-9])/g, '$1-$2')
        .replace(/([^0-9])([0-9])/g, '$1-$2')
        .replace(/-+/g, '-')
        .toLowerCase();
}

const adminModule: Module<AdminState, RootState> = {
  namespaced: true,
  state: {
    schedule: null,
    events: [],
    colorNames: Object.keys(colors).map(camelCaseToDash),
    modifierNames: Object.keys(colors.red).map(camelCaseToDash),
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
    async deleteSchedule({ dispatch }, id: number) {
      await dispatch('auth/makeAuthedRequest', {
        path: `/scheds/${id}`,
        method: 'DELETE',
      }, { root: true });
      await dispatch('fetchScheds', undefined, { root: true });
    },
    async newSchedule({ dispatch }, payload: ISchedule) {
      await dispatch('auth/makeAuthedRequest', {
        path: '/scheds',
        method: 'POST',
        body: payload,
      }, { root: true });
      await dispatch('fetchScheds', undefined, { root: true });
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

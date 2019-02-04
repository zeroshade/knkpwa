import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { RootState } from './states';
import authModule from './authmod';
import sched, { Schedule } from '@/api/schedule';
import { Event } from '@/api/event';

Vue.use(Vuex);

interface AdminState {
  schedule: Schedule | null;
}

export default new Vuex.Store<RootState>({
  modules: {
    auth: authModule,
    admin: {
      namespaced: true,
      state: {
        schedule: null,
      },
      getters: {
        sched(state) {
          return state.schedule;
        },
      },
      mutations: {
        setSched(state, payload) {
          state.schedule = payload;
          state.schedule.loadEvents();
        },
      },
      actions: {
        async loadSchedById({ commit }, payload) {
          const s = await sched.getSchedule(payload);
          await s.loadEvents();
          commit('setSched', s);
        },
        async updateSchedule({ commit }, payload) {
          commit('setSched', payload);
          await payload.save();
        },
      },
    },
  },
  state: {
    schedules: [],
    showModal: false,
    modalEvent: null,
    modalColor: '',
  },
  getters: {
    getScheduleById: (state) => (id: number) => {
      return state.schedules.find((s) => s.id === id);
    },
  },
  mutations: {
    setScheds(state: RootState, scheds: Schedule[]) {
      state.schedules = scheds;
    },
    showModal(state: RootState, payload: {ev: Event, color: string}) {
      state.showModal = true;
      state.modalEvent = payload.ev;
      state.modalColor = payload.color;
    },
    hideModal(state: RootState) {
      state.showModal = false;
      state.modalEvent = null;
      state.modalColor = '';
    },
  },
  actions: {
    async fetchScheds({ commit }) {
      const s = await sched.getSchedules();
      commit('setScheds', s);
    },
  },
});

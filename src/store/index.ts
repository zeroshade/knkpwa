import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { RootState } from './states';
import authModule from './authmod';
import adminModule from './adminmod';
import huntModule from './huntmod';
import sched, { Schedule } from '@/api/schedule';
import { Event } from '@/api/event';

Vue.use(Vuex);

export default new Vuex.Store<RootState>({
  modules: {
    auth: authModule,
    admin: adminModule,
    scavenger: huntModule,
  },
  state: {
    schedules: [],
    curSchedule: 0,
    showModal: false,
    modalEvent: null,
    modalColor: '',
  },
  getters: {
    getScheduleById: (state) => (id: number) => {
      return state.schedules.find((s) => s.id === id);
    },
    curSchedule(state: RootState): Schedule {
      return state.schedules[state.curSchedule];
    },
  },
  mutations: {
    setCurSchedule(state: RootState, id: number) {
      state.curSchedule = state.schedules.findIndex((s) => s.id === id);
      state.schedules[state.curSchedule].loadEvents();
    },
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
    logError(state: RootState, payload: Error) {
      console.log(payload);
    },
  },
  actions: {
    async fetchScheds({ commit }) {
      const s = await sched.getSchedules();
      commit('setScheds', s);
    },
  },
});

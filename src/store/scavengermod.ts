import { Module } from 'vuex';
import { ScavengerState, RootState } from './states';
import { IHunt, Hunt, Clue } from '@/api/hunt';
import { Cipher } from 'crypto';

const scavengerModule: Module<ScavengerState, RootState> = {
  namespaced: true,
  state: {
    hunts: [],
  },
  mutations: {
    setHunts(state: ScavengerState, payload: Hunt[]) {
      state.hunts = payload;
    },
    updateHunt(state: ScavengerState, payload: Hunt) {
      const idx = state.hunts.findIndex((h) => h.id === payload.id);
      if (idx !== -1) {
        state.hunts.splice(idx, 1, payload);
      } else {
        state.hunts.push(payload);
      }
    },
    updateClue(state: ScavengerState, payload: Clue) {
      const idx = state.hunts.findIndex((h) => h.id === payload.huntId);
      if (idx === -1) {
        throw new Error('Could not find Hunt!');
      }

      const hunt = state.hunts[idx];
      const clueIdx = hunt.clues.findIndex((c) => c.id === payload.id);
      if (clueIdx !== -1) {
        hunt.clues.splice(clueIdx, 1, payload);
      } else {
        hunt.clues.push(payload);
      }

      state.hunts.splice(idx, 1, hunt);
    },
    deleteClue(state: ScavengerState, payload: Clue) {
      const hidx = state.hunts.findIndex((h) => h.id === payload.huntId);
      if (hidx === -1) {
        throw new Error('Could not find Hunt!');
      }

      const hunt = state.hunts[hidx];
      hunt.clues.splice(hunt.clues.findIndex((c) => c.id === payload.id), 1);
      state.hunts.splice(hidx, 1, hunt);
    },
    removeHunt(state: ScavengerState, payload: Hunt) {
      state.hunts.splice(state.hunts.findIndex((h) => h.id === payload.id), 1);
    },
  },
  actions: {
    async removeHunt({commit, dispatch}, payload: Hunt) {
      await dispatch('auth/makeAuthedRequest', {
        path: `/hunt/${payload.id}`,
        method: 'DELETE',
      }, {root: true});
      commit('removeHunt', payload);
    },
    async updateHunt({commit, dispatch}, payload: Hunt) {
      const { id, title, desc } = payload;
      const body = { id, title, desc };
      if (id === -1) { body.id = 0; }

      await dispatch('auth/makeAuthedRequest', {
        path: '/hunt',
        method: 'POST',
        body,
      }, {root: true});
      if (id !== -1) {
        commit('updateHunt', payload);
      }
    },
    async loadHunts({commit, dispatch}) {
      const h = await dispatch('auth/makeAuthedRequest', {
        path: '/hunts',
        method: 'GET',
      }, {root: true});
      commit('setHunts', (await h.json()).map((o: IHunt) => new Hunt(o)));
    },
    async addClue({ commit, dispatch }, payload: Clue) {
      await dispatch('auth/makeAuthedRequest', {
        path: '/hunts/clue',
        method: 'PUT',
        body: payload,
      }, {root: true});
      commit('updateClue', payload);
    },
    async updateClue({ commit, dispatch }, payload: Clue) {
      await dispatch('auth/makeAuthedRequest', {
        path: '/hunts/clue',
        method: 'POST',
        body: payload,
      }, {root: true});
      commit('updateClue', payload);
    },
    async deleteClue({ commit, dispatch }, payload: Clue) {
      await dispatch('auth/makeAuthedRequest', {
        path: `/hunts/clue/${payload.id}`,
        method: 'DELETE',
      }, {root: true});
      commit('deleteClue', payload);
    },
  },
};

export default scavengerModule;

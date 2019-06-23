import { Module } from 'vuex';
import { RootState } from './states';
import { HuntInfo, Clue, IClue } from '@/api/hunt';

const huntModule: Module<{}, RootState> = {
  namespaced: true,
  actions: {
    async getHuntInfo({dispatch}): Promise<HuntInfo[]> {
      const h = await dispatch('auth/makeAuthedRequest', {
        path: '/huntinfo',
        method: 'GET',
      }, {root: true});
      return (await h.json());
    },
    async getClueByID({dispatch}, payload: string): Promise<Clue> {
      const c = await dispatch('auth/makeAuthedRequest', {
        path: `/hunts/clue/${payload}`,
        method: 'GET',
      }, {root: true});
      const ret: IClue = await c.json();
      return new Clue(ret.title, ret.text, ret.huntId, ret.id, ret.mapPiece, ret.color, ret.bgColor);
    },
    async getUserClues({dispatch}): Promise<Clue[]> {
      const c = await dispatch('auth/makeAuthedRequest', {
        path: '/my/clues',
        method: 'GET',
      }, {root: true});

      return ((await c.json()).map((o: IClue) => new Clue(o.title, o.text, o.huntId, o.id, o.mapPiece, o.color, o.bgColor)));
    },
    async addUserClue({dispatch}, id: string) {
      await dispatch('auth/makeAuthedRequest', {
        path: `/my/clues/${id}`,
        method: 'PUT',
      }, {root: true});
    },
  },
};

export default huntModule;

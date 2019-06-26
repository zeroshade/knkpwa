import { Module } from 'vuex';
import { RootState } from './states';
import { HuntInfo, Clue, IClue, MapPiece, Solution } from '@/api/hunt';

const huntModule: Module<{}, RootState> = {
  namespaced: true,
  actions: {
    async getMapPieceInfo({dispatch}): Promise<MapPiece[]> {
      const m = await dispatch('auth/makeAuthedRequest', {
        path: '/huntinfo/maps',
        method: 'GET',
      }, {root: true});
      return (await m.json());
    },
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
      return new Clue(ret.title, ret.text, ret.huntId, ret.id, ret.color, ret.bgColor);
    },
    async getUserClues({dispatch}): Promise<Clue[]> {
      const c = await dispatch('auth/makeAuthedRequest', {
        path: '/my/clues',
        method: 'GET',
      }, {root: true});

      return ((await c.json()).map((o: IClue) => new Clue(o.title, o.text, o.huntId, o.id, o.color, o.bgColor)));
    },
    async addUserClue({dispatch}, payload: {clueId: string, huntId: number }): Promise<boolean> {
      const resp = await dispatch('auth/makeAuthedRequest', {
        path: `/my/clues/${payload.huntId}/${payload.clueId}`,
        method: 'PUT',
      }, {root: true});
      return resp.status === 200;
    },
    async getOptions({dispatch}, id: number): Promise<Solution[]> {
      const resp = await dispatch('auth/makeAuthedRequest', {
        path: `/huntinfo/guess/${id}`,
        method: 'GET',
      }, {root: true});
      return (await resp.json());
    }
  },
};

export default huntModule;

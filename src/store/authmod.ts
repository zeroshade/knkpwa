import Authenticator from './auth';
import { AuthState, RootState } from './states';
import { Auth0UserProfile, Auth0DecodedHash } from 'auth0-js';
import { Module } from 'vuex';

const auth = new Authenticator();

interface AuthPayload {
  path: string;
  method: string;
  body?: object;
  attempts?: number;
}

const authModule: Module<AuthState, RootState> = {
  namespaced: true,
  state: {
    authenticated: !!localStorage.getItem('access_token'),
    accessToken: localStorage.getItem('access_token'),
    idToken: localStorage.getItem('id_token'),
    expiresAt: Number(localStorage.getItem('expires_at')) || 0,
    user: JSON.parse(localStorage.getItem('user') || '{}'),
    defaultView: 'rooms',
  },
  getters: {
    accessToken(state: AuthState): string {
      return state.accessToken || '';
    },
    authenticated(state: AuthState): boolean {
      return state.authenticated && new Date().getTime() < state.expiresAt;
    },
    authflag(state: AuthState): boolean {
      return state.authenticated;
    },
    admin(state: AuthState): boolean {
      return state.authenticated && state.user && state.user[auth.NAMESPACE + 'roles'].includes('admin');
    },
    avatar(state: AuthState): string {
      return state.user ? state.user.picture : '';
    },
    userfavs(state: AuthState): number[] {
      return state.user ? state.user[auth.NAMESPACE + 'favs'] : [];
    },
    username(state: AuthState): string {
      return state.user ? state.user.name : '';
    },
    userid(state: AuthState): string {
      return state.user ? state.user.sub : '';
    },
    nickname(state: AuthState): string {
      return state.user ? state.user.nickname : '';
    },
    useremail(state: AuthState): string {
      return state.user ? state.user.email || '' : '';
    },
    defview(state: AuthState): string {
      if (state.authenticated && state.user && state.user[auth.NAMESPACE + 'defaultView']) {
        return state.user[auth.NAMESPACE + 'defaultView'];
      }
      return state.defaultView;
    },
  },
  mutations: {
    authenticated(state: AuthState, authData: Auth0DecodedHash) {
      state.authenticated = true;
      state.accessToken = authData.accessToken || '';
      state.idToken = authData.idToken || '';
      state.expiresAt = (authData.expiresIn || 0) * 1000 + new Date().getTime();
      state.user = authData.idTokenPayload;

      localStorage.setItem('access_token', state.accessToken || '');
      localStorage.setItem('id_token', state.idToken || '');
      localStorage.setItem('expires_at', JSON.stringify(state.expiresAt));
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    logout(state: AuthState) {
      state.authenticated = false;
      state.accessToken = null;
      state.idToken = null;
      state.defaultView = 'rooms';

      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('user');
    },
    updateFavs(state: AuthState, favs) {
      if (state.user) {
        state.user[auth.NAMESPACE + 'favs'] = favs;
      }
    },
    setDefaultView(state: AuthState, view: string) {
      if (state.user) {
        state.user[auth.NAMESPACE + 'defaultView'] = view;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  actions: {
    login() {
      auth.login();
    },
    logout({ commit }) {
      commit('logout');
    },
    handleAuthentication({ commit }) {
      auth.handleAuthentication().then((authResult) => {
        commit('authenticated', authResult);
      }).catch((err) => {
        commit('logError', err, { root: true });
      });
    },
    renewAuth({ commit }) {
      auth.renewSession().then((authResult) => {
        commit('authenticated', authResult);
      }).catch((err) => {
        commit('logError', err, { root: true });
      });
    },
    toggleFav({ commit, state, getters }, id: number) {
      if (!state.user) { return; }

      let favs = getters.userfavs;
      if (!favs.includes(id)) {
        favs.push(id);
      } else {
        favs = favs.filter((f: number) => f !== id);
      }
      auth.updateUserMeta(state.accessToken || '', state.user.sub || '', {favs}).then((prof) => {
        if (!prof) { return; }
        commit('updateFavs', prof.user_metadata.favs);
      }).catch((err) => {
        commit('logError', err, { root: true });
      });
    },
    setDefaultView({ commit, state }, view: string) {
      if (!state.user) { return; }

      auth.updateUserMeta(state.accessToken || '', state.user.sub || '', {defaultView: view}).then((prof) => {
        if (!prof) { return; }
        commit('setDefaultView', prof.user_metadata.defaultView);
      }).catch((err) => {
        commit('logError', err, { root: true });
      });
    },
    async makeAuthedRequest({ state, dispatch }, payload: AuthPayload) {
      if (!state.user || (payload.attempts && payload.attempts > 2)) { return; }

      const resp = await fetch(process.env.VUE_APP_BACKEND_HOST + payload.path, {
        method: payload.method,
        body: payload.body ? JSON.stringify(payload.body) : undefined,
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      });

      if (resp.status === 401) {
        await dispatch('renewAuth');
        payload.attempts = (payload.attempts || 0) + 1;
        return await dispatch('makeAuthedRequest', payload);
      }
      return resp;
    },
    async updateSubscription({ state }, sub: PushSubscription) {
      if (!state.user) { return; }

      await fetch(process.env.VUE_APP_BACKEND_HOST + '/sub', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({subscription: sub}),
      });
    },
    async unsubscribe({ state }, sub: PushSubscription) {
      if (!state.user) { return; }

      await fetch(process.env.VUE_APP_BACKEND_HOST + '/sub', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({subscription: sub}),
      });
    },
  },
};

export default authModule;

import Authenticator from './auth';
import { AuthState, RootState } from './states';
import { Auth0UserProfile, Auth0DecodedHash } from 'auth0-js';
import { Module } from 'vuex';

const auth = new Authenticator();

const authModule: Module<AuthState, RootState> = {
  namespaced: true,
  state: {
    authenticated: !!localStorage.getItem('access_token'),
    accessToken: localStorage.getItem('access_token'),
    idToken: localStorage.getItem('id_token'),
    expiresAt: Number(localStorage.getItem('expires_at')) || 0,
    user: JSON.parse(localStorage.getItem('user') || '{}'),
  },
  getters: {
    authenticated(state: AuthState): boolean {
      return state.authenticated && new Date().getTime() < state.expiresAt;
    },
    authflag(state: AuthState): boolean {
      return state.authenticated;
    },
    admin(state: AuthState): boolean {
      return state.authenticated && state.user && state.user['http://www.thelazydm.org/roles'].includes('admin');
    },
    avatar(state: AuthState): string {
      return state.user ? state.user.picture : '';
    },
    userfavs(state: AuthState): number[] {
      return state.user ? state.user['http://www.thelazydm.org/favs'] : [];
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

      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('user');
    },
    updateFavs(state: AuthState, favs) {
      if (state.user) {
        state.user['http://www.thelazydm.org/favs'] = favs;
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
        console.log(err);
      });
    },
    renewAuth({ commit }) {
      auth.renewSession().then((authResult) => {
        commit('authenticated', authResult);
      }).catch((err) => {
        console.log(err);
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
        console.log(err);
      });
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

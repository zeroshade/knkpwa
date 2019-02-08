import Vue from 'vue';
import Router, { Route } from 'vue-router';
Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { path: '/', redirect: '/rooms' },
    {
      path: '/rooms', name: 'home',
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/RoomGrid.vue'),
    },
    {
      path: '/agenda', name: 'agenda',
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/Agenda.vue'),
    },
    {
      path: '/events', name: 'events',
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/Events.vue'),
    },
    {
      path: '/callback', component: () => import(/* webpackChunkName: "group-auth" */ '@/views/Auth.vue'), name: 'auth',
    },
  ],
});

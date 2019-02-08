<<<<<<< Updated upstream
import Vue from 'vue';
import VueRouter, { Route } from 'vue-router';
Vue.use(VueRouter);

export default new VueRouter({
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
=======
import Vue from 'vue';
import VueRouter, { Route } from 'vue-router';
Vue.use(VueRouter);

const props = (route: Route) => ({ id: +route.params.id || 3 });

export default new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { path: '/', redirect: '/rooms' },
    {
      path: '/rooms/:id?', name: 'rooms',
      props,
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/RoomGrid.vue'),
    },
    {
      path: '/agenda/:id?', name: 'agenda',
      props,
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/Agenda.vue'),
    },
    {
      path: '/events/:id?', name: 'events',
      props,
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/Events.vue'),
    },
    {
      path: '/callback', component: () => import(/* webpackChunkName: "group-auth" */ '@/views/Auth.vue'), name: 'auth',
    },
  ],
});
>>>>>>> Stashed changes

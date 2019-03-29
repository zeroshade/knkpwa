import Vue from 'vue';
import VueRouter, { Route } from 'vue-router';
Vue.use(VueRouter);

const props = (route: Route) => ({ id: +route.params.id || 5 });

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { path: '/', redirect: '/rooms' },
    {
      path: '/rooms/:id?', name: 'rooms',
      props,
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/RoomGrid.vue'),
      meta: {
        title: 'Room View',
      },
    },
    {
      path: '/agenda/:id?', name: 'agenda',
      props,
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/Agenda.vue'),
      meta: {
        title: 'Full View',
      },
    },
    {
      path: '/events/:id?', name: 'events',
      props,
      component: () => import(/* webpackChunkName: "group-app" */ '@/views/Events.vue'),
      meta: {
        title: 'Event View',
      },
    },
    {
      path: '/callback', component: () => import(/* webpackChunkName: "group-auth" */ '@/views/Auth.vue'),
      name: 'auth',
      meta: {
        title: 'Login Callback',
      },
    },
  ],
});

router.afterEach((to, from) => {
  document.title = 'KnK Schedule - ' + to.meta.title || 'Home';
});

export default router;

import Vue from 'vue';
import Router, { Route } from 'vue-router';
Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/admin', name: 'admin',
    },
    {
      path: '/admin/:id',
      name: 'admin.schedule',
      component: () => import(/* webpackChunkName: "group-admin" */ '@/views/admin/SchedHome.vue'),
      props: (route: Route) => ({ id: +route.params.id }),
    },
    {
      path: '/admin/:id/events',
      name: 'admin.events',
      props: (route: Route) => ({ id: +route.params.id }),
      component: () => import(/* webpackChunkName: "group-admin" */ '@/views/admin/EventTable.vue'),
    },
  ],
});

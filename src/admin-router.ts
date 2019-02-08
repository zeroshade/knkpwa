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
      component: () => import(/* webpackChunkName: "group-admin", webpackPreload: true */ '@/views/admin/Schedule.vue'),
      props: (route: Route) => ({ id: +route.params.id }),
      children: [
        {
          path: '', name: 'admin.schedule',
          component: () => import(/* webpackChunkName: "group-admin" */ '@/views/admin/SchedHome.vue'),
        },
        {
          path: 'events', name: 'admin.events',
          component: () => import(/* webpackChunkName: "group-admin" */ '@/views/admin/EventTable.vue'),
        },
      ],
    },
  ],
});

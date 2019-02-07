import Vue from 'vue';
import Router, { Route } from 'vue-router';
const AdminNav = () => import(/* webpackChunkName: "group-admin" */ '@/components/admin/NavDrawer.vue');
const AdminToolbar = () => import(/* webpackChunkName: "group-admin" */ '@/components/admin/Toolbar.vue');
const AdminSchedule = () => import(/* webpackChunkName: "group-admin" */ '@/views/admin/Schedule.vue');
Vue.use(Router);

const adminNavToolbar = {
  navbar: AdminNav,
  toolbar: AdminToolbar,
};

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/admin', name: 'admin',
      components: {
        ...adminNavToolbar,
      },
    },
    {
      path: '/admin/:id',
      components: {
        ...adminNavToolbar,
        default: AdminSchedule,
      },
      props: {
        navbar: false,
        toolbar: false,
        default: (route: Route) => ({ id: +route.params.id }),
      },
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

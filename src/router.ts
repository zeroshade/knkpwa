import Vue from 'vue';
import Router, { Route } from 'vue-router';
const RoomGrid = () => import(/* webpackChunkName: "group-app" */ '@/views/RoomGrid.vue');
const Agenda = () => import(/* webpackChunkName: "group-app" */ '@/views/Agenda.vue');
const Events = () => import(/* webpackChunkName: "group-app" */ '@/views/Events.vue');
const EventDialog = () => import(/* webpackChunkName: "group-app" */ '@/components/EventDialog.vue');
const Auth = () => import(/* webpackChunkName: "group-auth" */ '@/views/Auth.vue');
const NavBar = () => import(/* webpackChunkName: "group-base" */ '@/components/NavBar.vue');
const Toolbar = () => import(/* webpackChunkName: "group-base" */ '@/components/Toolbar.vue');
const AdminNav = () => import(/* webpackChunkName: "group-admin" */ '@/components/admin/NavDrawer.vue');
const AdminToolbar = () => import(/* webpackChunkName: "group-admin" */ '@/components/admin/Toolbar.vue');
const AdminSchedule = () => import(/* webpackChunkName: "group-admin" */ '@/views/admin/Schedule.vue');
Vue.use(Router);

const baseNavToolbar = {
  navbar: NavBar,
  toolbar: Toolbar,
  dialog: EventDialog,
};

const adminNavToolbar = {
  navbar: AdminNav,
  toolbar: AdminToolbar,
};

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { path: '/', redirect: '/rooms' },
    {
      path: '/rooms', name: 'home',
      components: {
        default: RoomGrid,
        ...baseNavToolbar,
      },
    },
    {
      path: '/agenda', name: 'agenda',
      components: {
        default: Agenda,
        ...baseNavToolbar,
      },
    },
    {
      path: '/events', name: 'events',
      components: {
        default: Events,
        ...baseNavToolbar,
      },
    },
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
    {
      path: '/callback', component: Auth, name: 'auth',
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (about.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   // component: () => import(/* webpackChunkName: "about" */ './views/About.vue'),
    // },
  ],
});

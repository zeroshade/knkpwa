import Vue from 'vue';
import Router, { Route } from 'vue-router';
import EventDialog from '@/components/EventDialog.vue';
import NavBar from '@/components/NavBar.vue';
import Toolbar from '@/components/Toolbar.vue';
Vue.use(Router);

const baseNavToolbar = {
  navbar: NavBar,
  toolbar: Toolbar,
  dialog: EventDialog,
};

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { path: '/', redirect: '/rooms' },
    {
      path: '/rooms', name: 'home',
      components: {
        default: () => import(/* webpackChunkName: "group-room", webpackPreload: true */ '@/views/RoomGrid.vue'),
        ...baseNavToolbar,
      },
    },
    {
      path: '/agenda', name: 'agenda',
      components: {
        default: () => import(/* webpackChunkName: "group-agenda" */ '@/views/Agenda.vue'),
        ...baseNavToolbar,
      },
    },
    {
      path: '/events', name: 'events',
      components: {
        default: () => import(/* webpackChunkName: "group-events" */ '@/views/Events.vue'),
        ...baseNavToolbar,
      },
    },
    {
      path: '/callback', component: () => import(/* webpackChunkName: "group-auth" */ '@/views/Auth.vue'), name: 'auth',
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

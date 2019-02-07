import Vue from 'vue';
import Router, { Route } from 'vue-router';
const RoomGrid = () => import(/* webpackChunkName: "group-room", webpackPreload:true */ '@/views/RoomGrid.vue');
const Agenda = () => import(/* webpackChunkName: "group-app" */ '@/views/Agenda.vue');
const Events = () => import(/* webpackChunkName: "group-app" */ '@/views/Events.vue');
const EventDialog = () => import(/* webpackChunkName: "group-app" */ '@/components/EventDialog.vue');
const Auth = () => import(/* webpackChunkName: "group-auth" */ '@/views/Auth.vue');
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

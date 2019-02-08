import Vue from 'vue';
import './plugins/vuetify';
import App from './Admin.vue';
import router from './admin-router';
import store from './store';
// import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';

import moment from 'moment';
Vue.config.productionTip = false;

Vue.filter('duration', (d: moment.Duration) => {
  let ret = `${d.minutes()}m`;
  if (d.hours() > 0) {
    ret = `${d.hours()}h ${ret}`;
  }
  return ret;
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

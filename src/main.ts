import Vue from 'vue';
import './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';
import VueAnalytics from 'vue-analytics';
import './registerServiceWorker';
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

Vue.use(VueAnalytics, {
  id: process.env.VUE_APP_UA_ID,
  router,
  debug: {
    sendHitTask: process.env.NODE_ENV === 'production',
  },
  autoTracking: {
    skipSamePath: true,
  },
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

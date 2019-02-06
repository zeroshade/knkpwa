import Vue from 'vue';
import './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';

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

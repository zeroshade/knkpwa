import Vue from 'vue';

export interface VueAnalytics {
  analyticsMiddleware: any;
  onAnalyticsReady: any;
  event: any;
  ecommerce: any;
  set: any;
  page: any;
  query: any;
  screenview: any;
  time: any;
  require: any;
  exception: any;
  social: any;
  disable: any;
  enable: any;
}

declare module 'vue/types/vue' {
  interface Vue {
    $ga: VueAnalytics;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    ga?: VueAnalytics;
  }
}

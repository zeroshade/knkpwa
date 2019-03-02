<template>
  <v-app light id='admin'>
    <nav-drawer v-model='drawer' style="z-index: 200;" />
    <toolbar :sched='sched' v-model='drawer' style="z-index: 200;" />
    <v-content fill-height fluid class='ml-4 mt-2 mr-3'>
      <v-layout align-top justify-left class='mb-3'>
        <v-flex xs12 md5>
          <v-card dark>
            <v-card-text v-if='sched'>
              <v-layout row justify-space-between>
                <v-flex xs6 class='text-xs-left'>
                  <strong>Start Date:</strong>
                  {{ sched.dayStart.format('ddd, MMM Do') }}
                </v-flex>
                <v-flex xs6 class='text-xs-right'>
                  <strong>End Date:</strong>
                  {{ sched.dayEnd.format('ddd, MMM Do') }}
                </v-flex>
              </v-layout>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
      <router-view :schedule='sched' :events='events' />
    </v-content>
    <v-footer app style="z-index: 200;">
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import { Schedule } from '@/api/schedule';
import { Event } from '@/api/event';
import { Route } from 'vue-router';
import NavDrawer from '@/components/admin/NavDrawer.vue';
import Toolbar from '@/components/admin/Toolbar.vue';

@Component({
  components: {
    NavDrawer,
    Toolbar,
  },
})
export default class Admin extends Vue {
  @Action('admin/loadSchedById') public loadsched!: (id: number) => Promise<void>;
  @Getter('auth/admin') public isAdmin!: boolean;
  @Getter('admin/sched') public sched!: Schedule | null;
  @Getter('admin/events') public events!: Event[];

  public drawer = null;

  public mounted() {
    if (!this.isAdmin) {
      window.location.href = process.env.BASE_URL;
      return;
    }
  }

  @Watch('$route')
  public routeChange(val: Route) {
    if (val.params.id && (this.sched === null || this.sched.id !== +val.params.id)) {
      this.loadsched(+val.params.id);
    }
  }
}
</script>

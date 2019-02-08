<template>
  <v-container fluid>
    <v-layout align-top justify-left class='mb-3' v-if='sched'>
      <v-flex xs5>
        <v-card dark>
          <v-card-text>
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
  </v-container>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { Schedule } from '@/api/schedule';
import { Event } from '@/api/event';

@Component
export default class AdminSchedule extends Vue {
  @Prop(Number) public id!: number;
  @Action('admin/loadSchedById') public loadsched!: (id: number) => Promise<void>;
  @Getter('admin/sched') public sched!: Schedule | null;
  @Getter('admin/events') public events!: Event[];

  public async created() {
    await this.loadsched(this.id);
  }
}
</script>

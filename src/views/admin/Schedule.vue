<template>
  <v-container fluid>
    <v-layout align-top justify-left>
      <v-flex xs5>
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
    <router-view />
  </v-container>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { Schedule } from '@/api/schedule';

@Component
export default class AdminSchedule extends Vue {
  @Prop(Number) public id!: number;
  @Action('admin/loadSchedById') public loadsched!: (id: number) => Promise<void>;
  @Getter('admin/sched') public sched!: Schedule | null;

  public async created() {
    await this.loadsched(this.id);
  }
}
</script>

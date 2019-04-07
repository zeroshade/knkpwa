<template>
  <v-container fluid :style='{ height: gridHeight + 100 + "px"}'>
    <v-layout style='position: relative'>
      <time-grid :times='times' :pixel-height='pixelHeight' v-if='sched' />
      <schedule-view v-if='this.sched' :pixel-height='pixelHeight'
        :cols='eventList' :height='gridHeight' :color-map='this.sched.colorMap'>
        <template slot='header' slot-scope='{ title }'>
          {{ title }}
        </template>
      </schedule-view>
    </v-layout>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Mixins } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import GridMixin from '@/mixins/grid-mixin';
import event, { Event } from '@/api/event';
import TimeGrid from '@/components/TimeGrid.vue';
import ScheduleView from '@/components/Schedule.vue';
import moment from 'moment';

@Component({
  components: {
    TimeGrid,
    ScheduleView,
  },
})
export default class Personal extends Mixins(GridMixin) {
  @Getter('auth/userfavs') public favs!: number[];

  public get eventList(): {[index: string]: {day: moment.Moment, events: Event[][]}} {
    if (!this.sched) { return {}; }

    const ret: {[index: string]: {day: moment.Moment, events: Event[][]}} = {};
    for (const day of this.dateRange) {
      const end = day.clone().add(this.sched.numHours, 'h');
      const events = event.orderEvents(
        this.sched.events.filter((ev) =>
          ev.start.isBetween(day, end, undefined, '[]') && this.favs.includes(ev.id)));
      ret[day.format('dddd')] = {day, events};
    }
    return ret;
  }
}
</script>
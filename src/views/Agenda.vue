<template>
  <v-container fluid class='sched-content' :style='{ height: gridHeight + 100 + "px"}'>
    <v-layout style='position: relative'>
      <time-grid :times='times' :pixel-height='pixelHeight' v-if='sched' />
      <schedule-view v-if='this.sched' :pixel-height='pixelHeight'
        :cols='eventsByDay' :height='gridHeight' :color-map='this.sched.colorMap'>
        <template slot='header' slot-scope='{ title }'>
          {{ title }}
        </template>
      </schedule-view>
    </v-layout>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Mixins } from 'vue-property-decorator';
import GridMixin from '@/mixins/grid-mixin';
import TimeGrid from '@/components/TimeGrid.vue';
import event, { Event } from '@/api/event';
import ScheduleView from '@/components/Schedule.vue';
import moment from 'moment';

@Component({
  components: {
    TimeGrid,
    ScheduleView,
  },
})
export default class Agenda extends Mixins(GridMixin) {
  public get eventsByDay() {
    if (!this.sched) { return []; }

    const ret: {[index: string]: {day: moment.Moment, events: Event[][]}} = {};
    for (const day of this.dateRange) {
      const end = day.clone().add(this.sched.numHours, 'h');
      const events = event.orderEvents(
        this.sched.events.filter((ev) =>
          ev.start.isBetween(day, end, undefined, '[]') && !ev.hideAgenda));
      ret[day.format('dddd')] = {day, events};
    }
    return ret;
  }
}
</script>

<style lang='styl' scoped>
.sched-content
  min-width 700px

</style>

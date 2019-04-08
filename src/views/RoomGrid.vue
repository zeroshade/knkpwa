<template>
  <v-container fluid :style='{ height: gridHeight + 100 + "px"}'>
    <v-layout column>
      <v-flex align-self-center>
        <v-btn-toggle v-model='dayIdx'>
          <v-btn flat v-for='(d, idx) in dateRange' :value='idx' :key='idx'
            @click='$ga.event("events","set room day", d.format("dddd"))'>
            {{ d.format('dddd') }}
          </v-btn>
        </v-btn-toggle>
      </v-flex>
      <v-flex style='position: relative; margin-top: 25px'>
        <time-grid :times='times' :pixel-height='pixelHeight' v-if='sched' />
        <schedule-view v-if='roomCols[dayIdx]' :pixel-height='pixelHeight'
          :cols='roomCols[dayIdx]' :height='gridHeight' :color-map='this.sched.colorMap'>
          <template slot='header' slot-scope='{ title }'>
            {{title}}
          </template>
        </schedule-view>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Mixins, Watch } from 'vue-property-decorator';
import TimeGrid from '@/components/TimeGrid.vue';
import ScheduleView from '@/components/Schedule.vue';
import GridMixin from '@/mixins/grid-mixin';
import event, { Event } from '@/api/event';
import sched, { Schedule } from '@/api/schedule';
import moment from 'moment';

@Component({
  components: {
    TimeGrid,
    ScheduleView,
  },
})
export default class RoomGrid extends Mixins(GridMixin) {
  public dayIdx = 0;

  @Watch('dateRange')
  public initDay(val: moment.Moment[]) {
    if (!val) { return; }

    const today = moment();
    val.forEach((date, idx) => {
      if (today.dayOfYear() === date.dayOfYear()) {
        this.dayIdx = idx;
      }
    });
  }

  public get times(): string[] {
    if (!this.sched || !this.roomCols.length) { return []; }

    const cols = this.roomCols[this.dayIdx];
    if (!cols || !Object.keys(cols).length) { return []; }
    return this.sched.times().slice((cols[Object.keys(cols)[0]].day.hours() - 12) * 2);
  }

  public get roomCols(): Array<{[index: string]: {day: moment.Moment, events: Event[][]}}> {
    if (!this.sched) { return []; }
    return this.dateRange.map((day: moment.Moment) => {
      const end = day.clone().add(this.sched.numHours, 'h');

      const byRoom: {[index: string]: Event[]} =
        this.sched.events.filter((ev: Event) => ev.start.isBetween(day, end, undefined, '[]'))
          .reduce((acc: {[index: string]: Event[]}, cur: Event) => {
            acc[cur.room] = acc[cur.room] || [];
            acc[cur.room].push(cur);
            return acc;
          }, {});

      const rooms = sched.roomSort(Object.keys(byRoom), this.sched);
      const ret: {[index: string]: {day: moment.Moment, events: Event[][]}} = {};
      let first = end;
      for (const k of rooms) {
        const events = event.orderEvents(byRoom[k]);
        if (events[0][0].start.isBefore(first)) {
          first = events[0][0].start;
        }
        ret[k] = {day, events};
      }
      day.hours(first.hours());
      return ret;
    });
  }
}
</script>

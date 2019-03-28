<template>
  <v-layout row justify-center class='evlayout'>
    <template v-for='(col, idx) in eventCols'>
      <v-flex class='evcol' :style='flexStyle(col[0])'
          :class='idx > 0 ? "ml-2" : ""'>
        <v-hover v-for='{ev, margin} in colItems(col)'
          :key='ev.id'>
          <v-card class='entry' slot-scope='{ hover }'
            :style='{ marginTop: margin + "px"}'
            :color='colorMap[ev.room] + (hover ? "lighten-1" : "")'
            :height='eventHeight(ev)' @click='showEvent(ev, colorMap[ev.room])'>
            <slot v-bind:event='ev'>
            </slot>
          </v-card>
        </v-hover>
      </v-flex>
    </template>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Mutation } from 'vuex-class';
import { Event } from '@/api/event';

@Component
export default class EventBlock extends Vue {
  @Prop({type: Number, default: 50}) public pixelHeight!: number;
  @Prop(Array) public events!: Event[];
  @Prop(Date) public day!: Date;
  @Prop(Object) public colorMap!: {[index: string]: string};
  @Mutation('showModal') public showModal!: (payload: {ev: Event, color: string}) => void;

  public showEvent(ev: Event, color: string): void {
    this.$ga.event('events', 'showmodal', ev.title);
    this.showModal({ev, color});
  }

  public eventHeight(ev: Event): number {
    return ev.duration.asMinutes() / 30 * this.pixelHeight - 5;
  }

  public flexStyle(ev: Event): {[index: string]: string|number} {
    return {
      top: (2 * this.pixelHeight * ev.start.diff(this.day, 'hours', true) - 1) + 'px',
      marginTop: 0,
    };
  }

  public get eventCols(): Event[][] {
    const cols: Event[][] = [];
    for (const ev of this.events) {
      let placed = false;

      for (const c of cols) {
        const lastEvent = c[c.length - 1];
        if (ev.start.isSameOrAfter(lastEvent.end)) {
          c.push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) { cols.push([ev]); }
    }
    return cols;
  }

  public colItems(col: Event[]): Array<{ev: Event, margin: number}> {
    const res: Array<{ev: Event, margin: number}> = [];
    for (const ev of col) {
      if (!res.length) {
        res.push({ev, margin: 0});
        continue;
      }
      const lastEvent = res[res.length - 1].ev;
      res.push({ev, margin: this.pixelHeight * (ev.start.diff(lastEvent.end, 'minutes') / 30) + 5});
    }
    return res;
  }
}
</script>

<style scoped lang='styl'>
.evlayout
  position absolute
  pointer-events none
  width 100%

.evcol
  position relative
  pointer-events auto
  height 100%
  min-width 40px

  .entry
    cursor pointer

</style>

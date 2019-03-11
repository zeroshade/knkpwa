<template>
  <v-calendar
    ref='calendar'
    type='custom-daily'
    :start='start'
    :end='end'
    :short-intervals='true'
    :first-interval='0'
    :interval-minutes='60'
    :interval-height='60'
    :interval-count='24'
    light>
    <template slot='interval' slot-scope='{ date, time }'>
      <div class='interval' @click='$emit("click:interval", {date, time})'></div>
    </template>
    <template slot='dayBody' slot-scope='{ date, timeToY, minutesToPixels }'>
      <template v-for='(e, idx) in orderEvents(eventMap[date] || [])'>
        <v-layout row justify-center class='evblock' :style='{ zIndex: 100 + -1 * idx }'>
          <template v-for='col in eventCols(e)'>
            <v-flex class='evcol' :style='{
              top: timeToY(col[0].start.format("HH:mm")) + "px" }'>
              <template v-for='{ev, margin} in colItems(col, minutesToPixels)'>
                <v-tooltip top z-index='3000'>
                  <v-sheet slot='activator' @click.native='$emit("click:event", ev)'
                    :key='ev.title' :color='colorMap[ev.room] || colorMap.other'
                    :height='minutesToPixels(ev.duration.asMinutes())'
                    :style='{ marginTop: margin + "px" }' class='my-event with-time'>
                    <slot v-bind:ev='ev'></slot>
                    <v-sheet dark class='lock mt-auto align-center justify-end d-flex'>
                      <v-icon size='16'>{{ ev.draft ? 'lock_open' : 'lock' }}</v-icon>
                    </v-sheet>
                  </v-sheet>
                  <span>
                    <slot name='tooltip' v-bind:ev='ev'>
                      {{ ev.start.format('h:mm a') }} -- {{ ev.end.format('h:mm a') }}
                    </slot>
                  </span>
                </v-tooltip>
              </template>
            </v-flex>
          </template>
        </v-layout>
      </template>
    </template>
  </v-calendar>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import event, { Event, MinToPixelFunc } from '@/api/event';

@Component
export default class Calendar extends Vue {
  @Prop(String) public start!: string;
  @Prop(String) public end!: string;
  @Prop(Object) public eventMap!: {[index: string]: Event[]};
  @Prop(Object) public colorMap!: {[index: string]: string};

  public orderEvents(evs: Event[]): Event[][] {
    return event.orderEvents(evs);
  }

  public eventCols(events: Event[]): Event[][] {
    return event.eventCols(events);
  }

  public colItems(col: Event[], minutesToPixels: MinToPixelFunc) {
    return event.colItems(col, minutesToPixels);
  }
}
</script>

<style lang='styl' scoped>
.interval
  height 100%
  width 100%

  &:hover
    background-color turquoise

.evblock
  top 0
  position absolute

  .evcol
    position relative
    width 70px


  & div:not(:first-child)
    margin-left 5px

.my-event
  overflow hidden
  text-overflow ellipsis
  white-space nowrap
  border-radius 2px
  color #fff
  border 1px solid black
  font-size 12px
  padding 3px
  cursor pointer
  position relative
  margin-right 8px
  pointer-events auto

  &:hover
    z-index 2

  &.with-time
    margin-right 0px

.lock
  background-color transparent
  float right
</style>

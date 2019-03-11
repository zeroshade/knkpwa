<template>
  <v-layout row justify-start align-baseline class='events'>
    <template v-if='$vuetify.breakpoint.mdAndUp'>
      <v-flex v-for='(c, k) in cols' :key='k' d-block
        class='event-group mb-0' :style='{ height: height + "px"}'>
        <v-card flat tile class='colheader' color='grey darken-4'>
          <v-card-title>
            <span class='text-xs-center'>
              <slot name='header' v-bind:title='k'></slot>
            </span>
          </v-card-title>
        </v-card>

        <div class='eventcol ml-1 mr-1'>
          <event-block v-for='(e, idx) in c.events' :key='idx' :color-map='colorMap'
            :pixel-height='pixelHeight' :events='e' :day='c.day.toDate()'>
            <template slot-scope='scoped'>
              <slot name='event' v-bind='scoped'>
                <v-card-title class='evtitle text-uppercase text-xs-center'>
                  <v-icon small dark v-if='scoped.event.icon'>
                    {{scoped.event.icon }}
                  </v-icon>
                  {{ scoped.event.title }}
                </v-card-title>
              </slot>
            </template>
          </event-block>
        </div>
      </v-flex>
    </template>
    <template v-else>
      <v-flex class='event-group mb-0' d-block xs12 :style='{height: height + "px"}'>
        <v-menu offset-y class='colheader'>
          <v-card color='deep-orange darken-3' flat tile slot='activator' :height='pixelHeight - 1 + "px"'>
            <v-card-title>
              <span class='text-xs-center'>
                <slot name='header' v-bind:title='showcol'></slot> <v-icon dark>expand_more</v-icon>
              </span>
            </v-card-title>
          </v-card>
          <v-list>
            <template v-for='(c, k) in cols' v-if='k !== showcol'>
              <v-divider :key='`divider-${k}`' />
              <v-list-tile :key='`menu-${k}`' @click='showcol = k'>
                <v-list-tile-title><slot name='header' v-bind:title='k'></slot></v-list-tile-title>
              </v-list-tile>
            </template>
          </v-list>
        </v-menu>

        <div class="eventcol ml-1 mr-1">
          <event-block v-for='(e, idx) in curcol.events' :key='idx' :color-map='colorMap'
            :pixel-height='pixelHeight' :events='e' :day='curcol.day.toDate()'>
            <template slot-scope='scoped'>
              <slot name='event' v-bind='scoped'>
                <v-card-title class='evtitle text-uppercase text-xs-center'>
                  <v-icon small dark v-if='scoped.event.icon'>
                    {{scoped.event.icon }}
                  </v-icon>
                  {{ scoped.event.title }}
                </v-card-title>
              </slot>
            </template>
          </event-block>
        </div>
      </v-flex>
    </template>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Event } from '@/api/event';
import moment from 'moment';
import EventBlock from '@/components/EventBlock.vue';

@Component({
  components: {
    EventBlock,
  },
})
export default class Schedule extends Vue {
  @Prop(Number) public pixelHeight!: number;
  @Prop(Object) public cols!: {[index: string]: {day: moment.Moment, events: Event[][]}};
  @Prop(Number) public height!: number;
  @Prop(Object) public colorMap!: {[index: string]: string};

  public theCol = '';

  public get showcol(): string {
    if (this.theCol) { return this.theCol; }

    const keys = Object.keys(this.cols);
    if (keys.length) {
      return keys[0];
    }
    return '';
  }

  public set showcol(idx: string) {
    this.theCol = idx;
  }

  public get curcol(): {day: moment.Moment, events: Event[][]} {
    if (this.showcol === '') { return {day: moment(), events: []}; }
    return this.cols[this.showcol];
  }
}
</script>

<style scoped lang='styl'>
.events
  width calc(100% - 55px)
  margin-left 55px
  position relative
  z-index 1

.event-group
  background none
  border 1px solid black

  div.eventcol
    padding 0px
    padding-top 2px
    position relative
    height 100%

.colheader
  height 49px
  border-bottom 1px solid black
  padding 0px
  width 100%

  div
    width 100%
    height 100%
    padding 0px

  span
    width 100%
    padding 0 0.5em

.evtitle
  padding-top 5px
  overflow hidden
  text-overflow ellipsis
  padding-left 0px
  padding-right 0px
  display -webkit-box
  -webkit-line-clamp 3
  -webkit-box-orient vertical
</style>

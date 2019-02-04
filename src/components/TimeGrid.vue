<template>
  <v-list one-line class='background-sched'>
    <template v-for='t in times'>
      <v-list-tile tag='span' class='time-span' v-bind:style='{height: pixelHeight + "px"}'>
        <v-list-tile-content class='time-tile'>
          <v-list-tile-title class='time-label'>
            <slot v-bind:t='t'>
              {{ t }}
            </slot>
          </v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </template>
  </v-list>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class TimeGrid extends Vue {
  @Prop(Array) public times!: string[];
  @Prop(Number) public pixelHeight!: number;
}
</script>

<style scoped lang='styl'>
.background-sched
  position absolute
  height 100%
  width: 100%
  top 0
  left -15px
  display block
  padding-top 26px
  background none

.time-tile:after
  content ''
  width calc(100% - 55px)
  height 1px
  background black
  margin-left 55px
  position absolute

.time-span {

}

.time-span:nth-of-type(2n) .time-label
  display none
</style>

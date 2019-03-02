<template>
  <v-menu
    ref='menu'
    v-model='menu'
    :close-on-content-click="false"
    :nudge-right='40'
    lazy
    transition='scale-transition'
    full-width
    offset-overflow
    offset-y
    max-width='250px'
    min-width='250px'
    @input='save = value'
    v-on:update:returnValue='$emit("input", save)'>
    <v-text-field :label='label'
      slot='activator'
      prepend-icon='access_time'
      readonly
      :rules='rules'
      :value='formatted' />
    <v-time-picker class='elevation=0'
      v-if='menu'
      v-model='selected'
      full-width
      :allowed-minutes='v => v % 5 === 0'
      @click:minute='$refs.menu.save()' />
  </v-menu>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import moment from 'moment';

@Component
export default class TimeMenu extends Vue {
  @Prop(String) public value!: string;
  @Prop(String) public label!: string;
  @Prop({ default: [] }) public rules!: Array<(v: string) => boolean | string>;

  public menu = false;
  public save = '';

  public get selected(): string {
    return this.value;
  }
  public set selected(val: string) {
    this.save = val;
  }
  public get formatted(): string {
    return moment(this.value, 'HH:mm').format('h:mm A');
  }
}
</script>

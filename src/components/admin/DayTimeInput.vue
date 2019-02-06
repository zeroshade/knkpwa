<template>
  <v-menu
    ref='menu'
    v-model='menu'
    :close-on-content-click='false'
    :nudge-right='40'
    lazy
    transition='scale-transition'
    full-width
    offset-overflow
    offset-y
    max-width='250px'
    min-width='250px'
    @input='selected = value'
    v-on:update:returnValue='$emit("input", selected)'
  >
    <v-text-field
      :label='label'
      slot='activator'
      prepend-icon='access_time'
      readonly
      :error='error'
      :error-messages='errorMsg'
      :value='formatted' />
    <v-card>
      <v-card-text class='pa-0'>
        <v-tabs grow v-model='activeTab'>
          <v-tab key='timer'>
            <slot name='timeIcon'>
              <v-icon>access_time</v-icon>
            </slot>
          </v-tab>
          <v-tab key='day'>
            <slot name='dayIcon'>
              <v-icon>event</v-icon>
            </slot>
          </v-tab>
          <v-tab-item key='timer'>
            <v-time-picker class='elevation-0'
              v-if='menu'
              v-model='time'
              color='green'
              full-width
              :allowed-minutes='v => v % 5 === 0'
              @click:minute="$refs.menu.save()"/>
          </v-tab-item>
          <v-tab-item key='day'>
            <v-select class='pl-5 pr-5'
              v-model='day'
              :items='options'
              label='Day'></v-select>
          </v-tab-item>
        </v-tabs>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <slot name='actions' :parent='this'>
          <v-btn flat @click='$refs.menu.save()'>Ok</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import moment from 'moment';

@Component
export default class DayTimeInput extends Vue {
  @Prop(Date) public value!: Date;
  @Prop(Array) public dayArray!: moment.Moment[];
  @Prop({default: 'Time'}) public label!: string;
  @Prop({default: false}) public error!: boolean;
  @Prop({default: ''}) public errorMsg!: string;

  public get options(): Array<{text: string, value: string}> {
    return this.dayArray.map((m) => ({text: m.format('ddd'), value: m.format('YYYY-MM-DD')}));
  }

  public activeTab = 0;
  public menu = false;
  public selected: Date | null = null;

  public created() {
    this.selected = this.value;
  }

  public get formatted(): string {
    return moment(this.value).format('ddd, h:mm a');
  }

  public get day(): string {
    const date = moment(this.value);
    return date.format('YYYY-MM-DD');
  }
  public set day(val: string) {
    const day = moment(val, 'YYYY-MM-DD');
    const cur = moment(this.value);
    this.selected = cur.dayOfYear(day.dayOfYear()).toDate();
  }

  public get time(): string {
    return moment(this.value).format('HH:mm');
  }
  public set time(val: string) {
    const time = moment(val, 'HH:mm');
    if (this.selected === null) {
      this.selected = time.toDate();
    } else {
      this.selected = moment(this.selected).hour(time.hour()).minute(time.minute()).second(0).toDate();
    }
  }
}
</script>

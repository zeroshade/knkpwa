<template>
  <v-dialog persistent :value='show' max-width='500'>
    <v-form ref='form' v-model='valid' lazy-validation>
      <v-card>
        <v-card-title class='headline' primary-title>
          <slot name='header'>
            Edit Event
          </slot>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-layout wrap>
            <v-flex xs8>
              <v-text-field label='Title' v-model='saved.title' :rules='[required]' />
            </v-flex>
            <v-flex xs5>
              <v-combobox label='Room' v-model='saved.room'
                :items='roomList' :rules='[required]' />
            </v-flex>
            <v-flex xs5 offset-xs1>
              <v-combobox label='Organizer'
                :value='saved.organizer ? saved.organizer.split(",").map(o => o.trim()) : saved.organizer'
                @input='saved.organizer = $event.join(", ")'
                :items='organizerList' multiple chips :rules='[required]' />
            </v-flex>
            <v-flex xs3>
              <v-select label='Start Day' v-model='startDay'
                :rules='[required]'
                :items='dayList' item-text='day' item-value='date' />
            </v-flex>
            <v-flex xs3 offset-xs4>
              <time-menu label='Start' v-model='startTime'
                :rules='[v => saved.start.isBefore(saved.end) || "Cant start before end"]'
              />
            </v-flex>
            <v-flex xs3>
              <v-select label='End Day' v-model='endDay'
                :items='dayList' :rules='[required]'
                item-text='day' item-value='date' />
            </v-flex>
            <v-flex xs3 offset-xs4>
              <time-menu label='End' v-model='endTime'
                :rules='[v => saved.end.isAfter(saved.start) || "Cant start before end"]'
              />
            </v-flex>
            <v-flex xs6>
              <v-text-field label='icon' v-model='saved.icon' />
            </v-flex>
            <v-flex xs4 offset-xs1>
              <v-icon large v-if='saved.icon'>{{saved.icon}}</v-icon>
            </v-flex>
            <v-flex xs12>
              <v-textarea label='Description' v-model='saved.desc' />
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <slot name='left-actions'>
          </slot>
          <v-spacer />
          <slot name='right-actions'>
            <v-btn color='warning' @click='$emit("update:show", false)'>Cancel</v-btn>
          </slot>
          <v-btn color='success' :disabled='!this.valid' @click='$refs.form.validate() && save()'>
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator';
import { Event } from '@/api/event';
import TimeMenu from '@/components/admin/TimeMenu.vue';
import moment from 'moment';

@Component({
  components: {
    TimeMenu,
  },
})
export default class EditEvent extends Vue {
  @Prop(Object) public value!: Event;
  @Prop(Boolean) public readonly show!: boolean;
  @Prop(Array) public readonly roomList!: string[];
  @Prop(Array) public readonly organizerList!: string[];
  @Prop(Array) public readonly dayList!: Array<{ day: string, date: string }>;

  public valid = true;
  public saved: Event = new Event();
  public readonly dateFmt = 'YYYY-MM-DD';
  public readonly timeFmt = 'HH:mm';
  public required = (v: string) => !!v || 'Cannot be empty';

  public get startDay(): string {
    return this.saved.start.format(this.dateFmt);
  }

  public set startDay(val: string) {
    const duration = this.saved.duration;
    const newday = moment(val, this.dateFmt);
    this.saved.start = this.saved.start.clone().year(newday.year()).dayOfYear(newday.dayOfYear());
    this.saved.end = this.saved.start.clone().add(duration);
  }

  public get endDay(): string {
    return this.saved.end.format(this.dateFmt);
  }

  public set endDay(val: string) {
    const newday = moment(val, this.dateFmt);
    this.saved.end = this.saved.end.clone().year(newday.year()).dayOfYear(newday.dayOfYear());
  }

  public get startTime(): string {
    return this.saved.start.format(this.timeFmt);
  }

  public set startTime(val: string) {
    const newtime = moment(val, this.timeFmt);
    this.saved.start = this.saved.start.clone().hours(newtime.hours()).minutes(newtime.minutes());
    (this.$refs.form as HTMLFormElement).validate();
  }

  public get endTime(): string {
    return this.saved.end.format(this.timeFmt);
  }

  public set endTime(val: string) {
    const newtime = moment(val, this.timeFmt);
    const prevHours = this.saved.end.hours();
    this.saved.end = this.saved.start.clone().hours(newtime.hours()).minutes(newtime.minutes());

    if (newtime.hours() < 3 && this.saved.start.hours() > 3) {
      this.saved.end.add(1, 'd');
    }
    (this.$refs.form as HTMLFormElement).validate();
  }

  @Emit()
  public save() {
    this.$emit('input', this.saved);
    this.$emit('update:show', false);
  }

  @Watch('show')
  public active() {
    if (this.show) {
      this.saved = new Event(this.value.getIEvent());
    }
  }
}
</script>

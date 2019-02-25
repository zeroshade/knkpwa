<template>
  <v-layout wrap>
    <v-flex xs10 class='pl-2'>
      <v-sheet height='850px'>
        <draft-calendar
          :start='schedule.dayStart.format("YYYY-MM-DD")'
          :end='schedule.dayEnd.format("YYYY-MM-DD")'
          :colorMap='schedule.colorMap' :eventMap='eventMap'
          v-on:click:interval='showDialog($event.date, $event.time)'
          v-on:click:event='editEvent = $event; deleteDialog = true;'>
          <template slot-scope='{ev}'>
            {{ ev.title }}<br />{{ ev.room }}
          </template>
        </draft-calendar>
      </v-sheet>
    </v-flex>
    <v-dialog persistent v-model='dialog' max-width='500'>
      <v-form ref='form' v-model='valid' lazy-validation>
        <v-card>
          <v-card-title class='headline' primary-title>
            Add To Draft -- {{ editEvent.start.format('ddd') }}
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-layout wrap>
              <v-flex xs8>
                <v-text-field label='Title'
                  v-model='editEvent.title'
                  :rules='[required]'
                />
              </v-flex>
              <v-flex xs5>
                <v-combobox label='Room'
                  v-model='editEvent.room'
                  :items='roomList'
                  :rules='[required]' />
              </v-flex>
              <v-flex xs5 offset-xs1>
                <v-combobox label='Organizer'
                  :value='editEvent.organizer ? editEvent.organizer.split(",").map(o => o.trim()) : editEvent.organizer'
                  @input='editEvent.organizer = $event.join(", ")'
                  :items='organizerList'
                  multiple
                  chips
                  :rules='[required]' />
              </v-flex>
              <v-flex xs5>
                <time-menu
                  label='Start'
                  v-model='startTime' />
              </v-flex>
              <v-flex xs5 offset-xs1>
                <time-menu label='End' v-model='endTime' />
              </v-flex>
              <v-flex xs6>
                <v-text-field label='icon' v-model='editEvent.icon' />
              </v-flex>
              <v-flex xs4 offset-xs1>
                <v-icon large v-if='editEvent.icon'>{{ editEvent.icon }}</v-icon>
              </v-flex>
              <v-flex xs12>
                <v-textarea label='Description' v-model='editEvent.desc' />
              </v-flex>
            </v-layout>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color='warning' @click='dialog = false'>Cancel</v-btn>
            <v-btn color='success' :disabled='!this.valid'
              @click='addToDraft()'>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
    <v-dialog persistent v-model='deleteDialog' max-width='500'>
      <v-card>
        <v-card-title class='headline' primary-title>
          Remove From Draft
        </v-card-title>
        <v-card-text v-if='!editEvent.draft'>
          You can only remove Draft Events this way. Use the event list to remove
          this event.
        </v-card-text>
        <v-card-text v-else>
          <p>Choose <em class='success white--text'>Delete</em> to delete this event from the draft.</p>
          <p>Choose <em class='info white--text'>Publish</em> to move the event to the actual event list and
            have it show up on the public calendar</p>
        </v-card-text>
        <v-card-actions>
          <v-btn class='info' :disabled='!editEvent.draft'
            @click='publishEvent(editEvent); deleteDialog = false;'>Publish</v-btn>
          <v-spacer />
          <v-btn class='warning' @click='deleteDialog = false'>Cancel</v-btn>
          <v-btn :disabled='!editEvent.draft'
            class='success'
            @click='removeDraftEvent(editEvent); deleteDialog = false;'>
              Delete
            </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Schedule } from '@/api/schedule';
import DraftCalendar from '@/components/admin/Calendar.vue';
import TimeMenu from '@/components/admin/TimeMenu.vue';
import { Event } from '@/api/event';
import { Action, Getter } from 'vuex-class';
import moment from 'moment';

@Component({
  components: {
    DraftCalendar,
    TimeMenu,
  },
})
export default class Draft extends Vue {
  @Prop(Object) public schedule!: Schedule;
  @Prop(Array) public events!: Event[];
  @Action('admin/loadDraft') public loadDraft!: (id: number) => Promise<void>;
  @Getter('admin/draft') public draftEvents!: Event[];
  @Action('admin/addDraftEvent') public addDraftEvent!: (ev: Event) => Promise<void>;
  @Action('admin/removeDraftEvent') public removeDraftEvent!: (ev: Event) => Promise<void>;
  @Action('admin/publishEvent') public publishEvent!: (ev: Event) => Promise<void>;

  public dialog = false;
  public deleteDialog = false;
  public valid = true;
  public menu = false;
  public editEvent: Event = new Event();

  public required = (v: string) => !!v || 'Cannot be empty';

  public mounted() {
    this.loadDraft(this.schedule.id);
  }

  public get startTime(): string {
    return this.editEvent.start.format('HH:mm');
  }

  public set startTime(val: string) {
    this.editEvent.start = moment(this.editEvent.start.format('YYYY-MM-DD ') + val, 'YYYY-MM-DD HH:mm');
  }

  public get endTime(): string {
    return this.editEvent.end.format('HH:mm');
  }

  public set endTime(val: string) {
    this.editEvent.end = moment(this.editEvent.end.format('YYYY-MM-DD ') + val, 'YYYY-MM-DD HH:mm');
  }

  public showDialog(date: string, time: string) {
    this.editEvent = new Event();
    this.editEvent.schedId = this.schedule.id;
    this.editEvent.start = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm');
    this.editEvent.clear();
    this.editEvent.id = 0;
    this.editEvent.draft = true;
    this.endTime = this.editEvent.end.format('H:mm');
    this.dialog = true;
  }

  public addToDraft() {
    const form = this.$refs.form as HTMLFormElement;
    if (!form.validate()) { return; }
    const e = new Event(this.editEvent.getIEvent());
    this.addDraftEvent(e);
    this.dialog = false;
  }

  public get roomList(): string[] {
    return Array.from(new Set([...this.events.map((e) => e.room),
      ...this.draftEvents.map((e) => e.room)]));
  }

  public get organizerList(): string[] {
    const reduceFunc = (acc: Set<string>, cv: Event) => {
      cv.organizer.split(',').map((o) => o.trim()).forEach(acc.add.bind(acc));
      return acc;
    };
    const set = this.events.reduce(reduceFunc, new Set());
    return Array.from(this.draftEvents.reduce(reduceFunc, set));
  }

  public get eventMap(): {[index: string]: Event[]} {
    const map: {[index: string]: Event[]} = {};
    const add = (e: Event) => {
      const day = e.start.format('YYYY-MM-DD');
      (map[day] = map[day] || []).push(e);
    };

    this.events.forEach(add);
    this.draftEvents.forEach(add);

    return map;
  }
}
</script>

<style lang='styl' scoped>
</style>

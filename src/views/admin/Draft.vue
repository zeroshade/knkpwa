<template>
  <v-layout wrap>
    <v-flex xs10 class='pl-2'>
      <v-sheet height='100%' class='mb-3'>
        <draft-calendar v-if='schedule'
          :start='schedule.dayStart.format("YYYY-MM-DD")'
          :end='schedule.dayEnd.format("YYYY-MM-DD")'
          :colorMap='schedule.colorMap' :eventMap='eventMap'
          v-on:click:interval='showDialog($event.date, $event.time)'
          v-on:click:event='editDraft($event)'>
          <template slot-scope='{ev}'>
            {{ ev.title }}<br />{{ ev.room }}
          </template>
        </draft-calendar>
      </v-sheet>
    </v-flex>
    <v-dialog persistent v-model='notifyDialog' max-width='500'>
      <v-card>
        <v-card-title class='headline' primary-title>
          Notification
        </v-card-title>
        <v-card-text>
          You can only remove Draft Events this way. Use the event list to remove
          this event.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class='warning' @click='notifyDialog = false'>Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <edit-event ref='editform' :day-list='dayList' :room-list='roomList' :organizer-list='organizerList'
      :show.sync='dialog' v-model='editEvent' @save='saveDraft()'>
      <template slot='header'>
        Edit Event <v-spacer />
        <v-tooltip bottom>
          <template v-slot:activator='{ on }'>
            <v-btn flat icon color='red' v-if='editEvent.id !== 0' v-on='on'
              @click='dialog = false; removeDraftEvent(editEvent);'>
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
          <span>Delete</span>
        </v-tooltip>
      </template>
      <template slot='left-actions'>
        <v-btn class='info' :disabled='editEvent.id === 0 || ($refs.editform && !$refs.editform.valid)'
          @click='$refs.editform.save(); publishEvent(editEvent);'>
          Save &amp; Publish
        </v-btn>
      </template>
    </edit-event>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Schedule } from '@/api/schedule';
import DraftCalendar from '@/components/admin/Calendar.vue';
import EditEvent from '@/components/admin/EditEvent.vue';
import { Event } from '@/api/event';
import { Action, Getter } from 'vuex-class';
import moment from 'moment';

@Component({
  components: {
    DraftCalendar,
    EditEvent,
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
  public notifyDialog = false;
  public editEvent: Event = new Event();

  public mounted() {
    this.loadDraft(+this.$route.params.id);
  }

  public showDialog(date: string, time: string) {
    this.editEvent = new Event();
    this.editEvent.schedId = this.schedule.id;
    this.editEvent.start = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm');
    this.editEvent.clear();
    this.editEvent.id = 0;
    this.editEvent.draft = true;
    this.dialog = true;
  }

  public saveDraft() {
    this.addDraftEvent(this.editEvent);
  }

  public editDraft(ev: Event) {
    this.editEvent = ev;
    if (this.editEvent.draft) {
      this.dialog = true;
    } else {
      this.notifyDialog = true;
    }
  }

  public get dayList(): Array<{ day: string, date: string }> {
    return this.schedule.dateRange().map((m) => ({ day: m.format('ddd'), date: m.format('YYYY-MM-DD') }));
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

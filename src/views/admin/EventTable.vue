<template>
  <v-card>
    <v-card-title>
      <p class='headline'>Events</p>
      <v-spacer />
      <v-text-field append-icon='search' label='Search'
        single-line hide-details v-model='search' />
    </v-card-title>
    <v-data-table v-if='schedule'
      :items='events'
      class='elevation-5'
      :search='search'
      :headers='headers'
      :rows-per-page-items='[10,20,35,{"text": "$vuetify.dataIterator.rowsPerPageAll", "value":-1}]'
      :loading='events.length === 0'>
      <template slot='items' slot-scope='{ item }'>
        <td width='25%'>
          <inline-edit-text label='Title'
            v-model='item.title'
            @save='updateEv(item)' />
        </td>
        <td>
          <inline-day-time
            :maxDate='item.end.toDate()'
            :value='item.start.toDate()'
            @input='item.start = convert($event)'
            @save='updateEv(item)'
            :dayArray='daySelect' format='ddd, h:mm a'/>
        </td>
        <td>
          <inline-day-time
            :minDate='item.start.toDate()'
            :value='item.end.toDate()'
            @input='item.end = convert($event)'
            @save='updateEv(item)'
            :dayArray='daySelect' format='ddd, h:mm a' />
        </td>
        <td>
          <inline-edit-text label='Organizer'
            v-model='item.organizer'
            @save='updateEv(item)' />
        </td>
        <td>{{ item.duration | duration }}</td>
        <td>
          <inline-edit-text label='Room'
            v-model='item.room'
            @save='updateEv(item)' />
        </td>
        <td>
          <v-icon v-if='item.icon' v-text='item.icon'></v-icon>
        </td>
        <td class='justify-center px-0'>
          <v-btn small icon @click='openEdit(item)' class='pr-0'>
            <v-icon small>edit</v-icon>
          </v-btn>
          <v-btn small icon @click='toDelete = item; confirmDialog = true'>
            <v-icon small>delete</v-icon>
          </v-btn>
        </td>
      </template>
    </v-data-table>
    <v-dialog v-model='confirmDialog' persistent max-width='300'>
      <v-card>
        <v-card-title class='headline pb-1'>Confirm Delete</v-card-title>
        <v-divider />
        <v-card-text v-if='toDelete'>
          Are you sure you want to delete
          <strong>{{ toDelete.title }}</strong>?
          <br /><br />
          <em><strong>This cannot be undone</strong></em>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn flat @click='deleteEv(toDelete.id); toDelete = null; confirmDialog = false'>
            Yes
          </v-btn>
          <v-spacer />
          <v-btn flat @click='confirmDialog = false'>
            No
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model='editDialog' lazy max-width='550'>
      <v-form ref='form' v-model='valid' lazy-validation>
        <v-card v-if='toEdit !== null'>
          <v-card-title class='headline pb-1'>Edit Event</v-card-title>
          <v-divider />
          <v-card-text>
            <v-layout wrap>
              <v-flex xs8>
                <v-text-field label='Title'
                  v-model='toEdit.title'
                  :rules='[v => !!v || "Cannot be empty"]'/>
              </v-flex>
              <v-flex xs5>
                <v-text-field label='Room'
                  v-model='toEdit.room'
                  :rules='[v => !!v || "Cannot be empty"]'/>
              </v-flex>
              <v-flex xs5 offset-xs1>
                <v-text-field label='Organizer'
                  v-model='toEdit.organizer'
                  :rules='[v => !!v || "Cannot be empty"]'/>
              </v-flex>
              <v-flex xs5>
                <day-time-input
                  :dayArray='daySelect'
                  label='Start'
                  :error-msg='toEdit.start.isSameOrAfter(toEdit.end) ? "Invalid Date":""'
                  :value='toEdit.start.toDate()'
                  @input='toEdit.start = convert($event)' />
              </v-flex>
              <v-flex xs5 offset-xs1>
                <day-time-input
                  :dayArray='daySelect'
                  label='End'
                  :error-msg='toEdit.end.isSameOrBefore(toEdit.start) ? "Invalid Date":""'
                  :value='toEdit.end.toDate()'
                  @input='toEdit.end = convert($event)' />
              </v-flex>
              <v-flex xs8>
                <v-checkbox v-model='toEdit.hideAgenda'
                  label='Hide in Agenda View?' />
              </v-flex>
              <v-flex xs6>
                <v-text-field label='icon' v-model='toEdit.icon' />
              </v-flex>
              <v-flex xs4 offset-xs1>
                <v-icon large v-if='toEdit.icon'>{{ toEdit.icon }}</v-icon>
              </v-flex>
              <v-flex xs12>
                <v-textarea label='Description' v-model='toEdit.desc' />
              </v-flex>
            </v-layout>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn color='warning' flat @click.native=''>Close</v-btn>
            <v-btn color='success' :disabled='!this.valid' flat @click.native=''>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-card>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import { Schedule } from '@/api/schedule';
import { Event } from '@/api/event';
import moment from 'moment';
import InlineEditText from '@/components/admin/InlineEditText.vue';
import InlineDayTime from '@/components/admin/InlineDayTime.vue';
import EventDialog from '@/components/admin/EventDialog.vue';
import DayTimeInput from '@/components/admin/DayTimeInput.vue';

@Component({
  components: {
    InlineEditText,
    InlineDayTime,
    EventDialog,
    DayTimeInput,
  },
})
export default class EventTable extends Vue {
  @Prop(Object) public schedule!: Schedule;
  @Prop(Array) public events!: Event[];
  @Action('admin/updateEvent') public updateEv!: (ev: Event) => Promise<void>;
  @Action('admin/delEvent') public deleteEv!: (id: number) => Promise<void>;

  public search: string = '';
  public valid = true;
  public confirmDialog = false;
  public editDialog = false;
  public toDelete: Event | null = null;
  public toEdit: Event | null = null;

  public get daySelect(): moment.Moment[] {
    const range = this.schedule.dateRange();
    range.push(range[range.length - 1].clone().add(1, 'd'));
    return range;
  }

  public readonly headers = [
    {text: 'Name', align: 'left', sortable: true, value: 'title'},
    {text: 'Start', align: 'left', sortable: true, value: 'start'},
    {text: 'End', align: 'left', sortable: true, value: 'end'},
    {text: 'Organizer', align: 'left', sortable: true, value: 'organizer'},
    {text: 'Duration', sortable: false, value: 'duration'},
    {text: 'Room', value: 'room', sortable: true},
    {text: 'Icon', value: 'icon', sortable: false},
    {text: '', sortable: false},
  ];

  public openEdit(item: Event) {
    this.toEdit = new Event(item.getIEvent());
    this.editDialog = true;
  }

  public convert(dt: Date): moment.Moment {
    return moment(dt);
  }
}
</script>

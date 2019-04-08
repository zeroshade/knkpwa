<template>
  <v-layout wrap justify-space-between>
    <v-flex xs12 md5 v-if='schedule'>
      <v-card class='mt-3'>
        <v-card-title class='headline'>Colors!</v-card-title>
        <v-card-text>
          <v-data-table
            hide-headers hide-actions
            :headers-length='2' :items='rooms'>
            <template slot='items' slot-scope='{ item }'>
              <td>{{ item }}</td>
              <td :class='schedule.colorMap[item]' width='50%'>
                <v-edit-dialog persistent large
                  lazy
                  @open='open(item)' @save='save(item)'>
                  <span class='grey--text text--lighten-5'>{{ schedule.colorMap[item] }}</span>
                  <template slot='input'>
                    <color-chooser v-model='tempColor' />
                  </template>
                </v-edit-dialog>
              </td>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-flex>
    <v-flex xs12 md3 v-if='schedule'>
      <v-card class='mt-3'>
        <v-card-title class='headline'>Order Rooms</v-card-title>
        <v-card-text>
          <div v-drag-and-drop:options='dragOptions'>
            <ol class='order-list' @reordered='reorder'>
              <li class='drag-item' v-for='r in roomOrder' :key='r' :data-id='r'>
                {{ r }}
              </li>
            </ol>
          </div>
        </v-card-text>
      </v-card>
    </v-flex>
    <v-flex xs12 md5 v-if='schedule'>
      <v-card class='mt-3'>
        <v-card-title class='headline'>Delete This Event?</v-card-title>
        <v-card-actions class='justify-center'>
          <v-dialog persistent v-model='dialog' max-width='300'>
            <v-btn slot='activator'>Delete</v-btn>
            <v-card>
              <v-card-title class='headline' primary-title>
                Are you Sure!?
              </v-card-title>
              <v-card-text>
                <strong><em>This Can't Be Undone!</em></strong>
              </v-card-text>
              <v-card-actions class='justify-center'>
                <v-btn @click.native='delSched()'>I'm Sure!</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import sched, { Schedule } from '@/api/schedule';
import { Action, Getter } from 'vuex-class';
import { Event } from '@/api/event';
import ColorChooser from '@/components/admin/ColorChooser.vue';

@Component({
  components: {
    ColorChooser,
  },
})
export default class AdminScheduleHome extends Vue {
  @Prop(Object) public schedule!: Schedule;
  @Prop(Array) public events!: Event[];
  @Action('admin/updateSchedule') public updateSchedule!: (s: Schedule) => Promise<void>;
  @Action('admin/deleteSchedule') public deleteSchedule!: (id: number) => Promise<void>;
  @Getter('admin/draft') public draftEvents!: Event[];

  public dragOptions = {
    dropzoneSelector: '.order-list',
    draggableSelector: '.drag-item',
    reactivityEnabled: true,
    showDropzoneAreas: true,
  };

  public dialog = false;
  public tempColor = '';

  public get roomOrder(): string[] {
    return sched.roomSort(this.rooms, this.schedule);
  }

  public reorder(ev: CustomEvent) {
    const reordered = this.roomOrder.filter((item) => ev.detail.ids.map(String).indexOf(item) >= 0);
    const nonreorder = this.roomOrder.filter((item) => ev.detail.ids.map(String).indexOf(item) < 0);
    nonreorder.splice(ev.detail.index, 0, ...reordered);
    const neworder: {[index: string]: number} = {};
    nonreorder.forEach((v, i) => {
      neworder[v] = i;
    });
    this.schedule.rooms = neworder;
    this.updateSchedule(this.schedule);
  }

  public async delSched() {
    await this.deleteSchedule(this.schedule.id);
    this.$router.push({ name: 'admin' });
  }

  public open(item: string) {
    this.tempColor = this.schedule.colorMap[item] || this.schedule.colorMap.other;
  }

  public save(item: string) {
    const s = this.schedule.clone();
    s.colorMap[item] = this.tempColor;
    this.updateSchedule(s);
  }

  public get rooms(): string[] {
    const ret = Array.from(new Set([...this.events.map((e) => e.room),
      ...this.draftEvents.map((e) => e.room)])).sort();
    ret.push('other');
    return ret;
  }
}
</script>

<style lang="stylus">
@keyframes nodeInserted
  from
    opacity 0.2
  to
    opacity 0.8

.item-dropzone-area
  height 2rem
  background #888
  opacity 0.8
  animation-duration 0.5s
  animation-name nodeInserted
</style>

<style lang="stylus" scoped>
.order-list
  display flex
  flex-direction column
  list-style-type none
  margin-right 5px
  overflow-y auto
  padding 3px !important
  padding-bottom 2rem

.drag-item
  display block
  margin 0 0 2px 0
  padding 0.2em 0.4em
  border-radius 0.2em
  line-height 1.3

  &:hover
    box-shadow 0 0 0 2px #6688bb, inset 0 0 0 1px #ddd

  &:focus
    outline none
    box-shadow 0 0 0 2px #6688bb, inset 0 0 0 1px #ddd

  &[aria-grabbed="true"]
    background #5cc1a6
    color #fff
</style>

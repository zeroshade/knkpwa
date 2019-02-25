<template>
  <v-layout wrap justify-space-between>
    <v-flex xs12 md6 v-if='schedule'>
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
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Schedule } from '@/api/schedule';
import { Action } from 'vuex-class';
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

  public dialog = false;
  public tempColor = '';

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
    const rooms = new Set(this.events.map((e) => e.room));
    const ret = Array.from(rooms).sort();
    ret.push('other');
    return ret;
  }
}
</script>

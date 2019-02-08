<template>
  <v-layout>
    <v-flex xs6 v-if='schedule'>
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
                  {{ schedule.colorMap[item] }}
                  <template slot='input'>
                    <p :class='tempColor + "white--text"'>{{tempColor}}</p>
                    <v-select v-model='primary' dense label='color' :items='colorNames'></v-select>
                    <v-select v-model='modifier' dense label='modifier' :items='modifierNames'></v-select>
                  </template>
                </v-edit-dialog>
              </td>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import colors from 'vuetify/es5/util/colors';
import { Schedule } from '@/api/schedule';
import { Action } from 'vuex-class';
import { Event } from '@/api/event';

function camelCaseToDash(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([0-9])([^0-9])/g, '$1-$2')
        .replace(/([^0-9])([0-9])/g, '$1-$2')
        .replace(/-+/g, '-')
        .toLowerCase();
}

@Component
export default class AdminScheduleHome extends Vue {
  @Prop(Object) public schedule!: Schedule;
  @Prop(Array) public events!: Event[];
  @Action('admin/updateSchedule') public updateSchedule!: (s: Schedule) => Promise<void>;

  public primary = '';
  public modifier = '';

  public open(item: string) {
    const s = this.schedule.colorMap[item].split(' ');
    this.primary = s[0];
    if (s.length > 1) {
      this.modifier = s[1];
    }
  }

  public save(item: string) {
    const s = this.schedule.clone();
    s.colorMap[item] = this.tempColor;
    this.updateSchedule(s);
  }

  public get tempColor(): string {
    return this.primary + ' ' + this.modifier;
  }

  public get rooms(): string[] {
    const rooms = new Set(this.events.map((e) => e.room));
    const ret = Array.from(rooms).sort();
    ret.push('other');
    return ret;
  }

  public get colorNames(): string[] {
    return Object.keys(colors).map(camelCaseToDash);
  }

  public get modifierNames(): string[] {
    return Object.keys(colors.red).map(camelCaseToDash);
  }
}
</script>

<template>
  <v-navigation-drawer :value='value' @input='$emit("input", $event)' temporary app>
    <v-list class='pa-1'>
      <v-list-tile tag='div'>
        <v-list-tile-title>Events</v-list-tile-title>
        <v-list-tile-action>
          <v-tooltip right>
            <v-icon slot='activator' @click='$store.dispatch("fetchScheds")'>refresh</v-icon>
            <span>Refresh the Events</span>
          </v-tooltip>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
    <v-list class='pt-0' dense>
      <v-divider light/>
      <v-list-tile v-for='s in items' :key='s.id'
        :to='{ name: $route.name, params: { id: s.id }}'>
        <v-list-tile-title>{{ s.title }}</v-list-tile-title>
      </v-list-tile>
    </v-list>
    <template v-if='authenticated'>
      <v-divider />
      <v-list dense two-line subheader>
        <v-subheader>Starred Events</v-subheader>

        <v-list-tile v-for='e in favs' :key='`fav-${e.id}`'
          @click='showModal({ev: e, color: eventColor(e)})'>
          <v-list-tile-content>
            <v-list-tile-title>{{ e.title }}</v-list-tile-title>
            <v-list-tile-sub-title>
              {{ e.start.format('ddd') }} - {{ e.start.format('h:mm a') }} - {{ e.room }}
            </v-list-tile-sub-title>
          </v-list-tile-content>

          <v-list-tile-action>
            <v-icon>star</v-icon>
          </v-list-tile-action>
        </v-list-tile>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Getter, State, Mutation } from 'vuex-class';
import { Schedule } from '@/api/schedule';
import { Event } from '@/api/event';

@Component
export default class NavBar extends Vue {
  @Prop(Boolean) public value!: boolean;
  @Getter('auth/authenticated') public authenticated!: boolean;
  @State('schedules') public items!: Schedule[];
  @Getter('auth/userfavs') public userfavs!: number[];
  @Mutation('showModal') public showModal!: (payload: {ev: Event, color: string}) => void;
  @Getter('curSchedule') public curSchedule!: Schedule;

  public get favs(): Event[] {
    if (!this.items.length) { return []; }

    return this.curSchedule.events.filter((e) => this.userfavs.includes(e.id))
      .sort((a, b) => a.start.diff(b.start));
  }

  public eventColor(ev: Event): string {
    return this.curSchedule.colorMap[ev.room];
  }
}
</script>

<template>
  <v-navigation-drawer :value='value' @input='$emit("input", $event)'
    dark app :temporary='$vuetify.breakpoint.smAndDown'
    :permanent='$vuetify.breakpoint.mdAndUp' clipped>
    <v-list dense>
      <v-list-tile avatar>
        <v-list-tile-avatar>
          <v-icon>home</v-icon>
        </v-list-tile-avatar>
        <v-list-tile-content>
          <v-list-tile-title>Home</v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action v-if='$vuetify.breakpoint.smAndDown'>
          <v-btn icon @click.stop='$emit("input", false)'>
            <v-icon>chevron_left</v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>

      <v-list-tile avatar :to='{name: "admin.new"}'>
        <v-list-tile-avatar>
          <v-icon>add_circle_outline</v-icon>
        </v-list-tile-avatar>
        <v-list-tile-content>
          <v-list-tile-title>Create New Schedule</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>

      <v-list-group prepend-icon="event" value='true'>
        <v-list-tile slot='activator'>
          <v-list-tile-title>Schedules</v-list-tile-title>
        </v-list-tile>

        <template v-for='s in schedules'>
          <template v-if='$route.params.id && +$route.params.id === s.id'>
            <v-list-group no-action sub-group value='true' :key='s.id'>
              <v-list-tile slot='activator'>
                <v-list-tile-title>{{ s.title }}</v-list-tile-title>
              </v-list-tile>

              <v-list-tile exact :to='{ name: "admin.schedule", params: { id: s.id }}'>
                <v-list-tile-title>Home</v-list-tile-title>
              </v-list-tile>

              <v-list-tile :to='{ name: "admin.events", params: { id: s.id }}'>
                <v-list-tile-title>Events</v-list-tile-title>
              </v-list-tile>

              <v-list-tile :to='{ name: "admin.draft", params: {id: s.id }}'>
                <v-list-tile-title>Build Draft</v-list-tile-title>
              </v-list-tile>

            </v-list-group>
          </template>
          <template v-else>
            <v-list-tile :to='{ name: "admin.schedule", params: { id: s.id }}' :key='s.id'>
              <v-list-tile-title v-text='s.title'></v-list-tile-title>
              <v-list-tile-action>
                <v-icon>edit</v-icon>
              </v-list-tile-action>
            </v-list-tile>
          </template>
        </template>
      </v-list-group>

      <v-list-group prepend-icon="my_location" value="false">
        <v-list-tile slot='activator'>
          <v-list-tile-title>Scavenger Hunts</v-list-tile-title>
        </v-list-tile>

        <v-list-tile :to='{ name: "admin.hunt", params: { huntid: h.id }}' v-for='h in hunts' :key='h.id'>
          <v-list-tile-title>{{ h.title }}</v-list-tile-title>
        </v-list-tile>

        <v-list-tile avatar :to='{ name: "admin.newhunt" }'>
          <v-list-tile-avatar>
            <v-icon>add_circle_outline</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title>Hunt List</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list-group>

    </v-list>
  </v-navigation-drawer>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Action, State, namespace } from 'vuex-class';
import { Schedule } from '@/api/schedule';
import { Hunt } from '@/api/hunt';

const mod = namespace('admin/scavenger');

@Component
export default class AdminNavDrawer extends Vue {
  @Prop(Boolean) public value!: boolean;
  @Action('fetchScheds') public fetchScheds!: () => Promise<void>;
  @State('schedules') public schedules!: Schedule[];
  @mod.Action('loadHunts') public loadHunts!: () => Promise<void>;
  @mod.State('hunts') public hunts!: Hunt[];

  public mounted() {
    if (!this.schedules.length) {
      this.fetchScheds();
    }
    if (!this.hunts.length) {
      this.loadHunts();
    }
  }
}
</script>

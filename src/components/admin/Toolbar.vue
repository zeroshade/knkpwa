<template>
  <v-toolbar dark app clipped-left dense>
    <v-toolbar-side-icon v-if='$vuetify.breakpoint.smAndDown'>
      <v-icon @click.stop='$emit("input", !value)'>menu</v-icon>
    </v-toolbar-side-icon>
    <v-toolbar-title>Admin Panel {{ sched ? `> ${sched.title}` : '' }}</v-toolbar-title>
    <v-spacer />
    <v-btn href='/'>Back to Schedule</v-btn>
  </v-toolbar>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { Schedule } from '@/api/schedule';

@Component
export default class AdminToolbar extends Vue {
  @Prop(Boolean) public value!: boolean;
  @Prop(Object) public sched!: Schedule;
}
</script>

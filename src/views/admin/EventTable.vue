<template>
  <v-card>
    <v-card-title>
      <p class='headline'>Events</p>
      <v-spacer />
      <v-text-field append-icon='search' label='Search'
        single-line hide-details />
    </v-card-title>
  </v-card>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class EventTable extends Vue {

}
</script>

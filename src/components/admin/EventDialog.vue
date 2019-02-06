<template>
  <v-card>
    <v-card-title class='headline pb-1'>Edit Event</v-card-title>
    <v-divider />
    <v-card-text>
      <v-form ref='form' v-model='valid' lazy-validation>
        <v-layout>
          <v-flex xs7>
            <v-text-field label='Title'
              v-model='value.title'
              :rules='[v => !!v || "Title is required"]' />
          </v-flex>
        </v-layout>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Event } from '@/api/event';

@Component
export default class EventDialog extends Vue {
  @Prop(Object) public value!: Event;

  public valid = true;
}
</script>

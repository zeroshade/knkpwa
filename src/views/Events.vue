<template>
  <v-card flat color='transparent'>
    <v-card-title>
      <v-spacer />
      <v-text-field v-model='search' single-line hide-details
        prepend-icon='search' label='Search'>
      </v-text-field>
    </v-card-title>
    <v-container grid-list-md fluid>
      <template v-for='day in dateRange'>
        <v-data-iterator :items='events.filter(i => i.start.isBetween(day, day.clone().add(sched.numHours, "h"), undefined, "[)"))'
          :pagination.sync='pagination' hide-actions :custom-sort='customSort'
          :search='search' content-tag='v-layout' content-class='layout row wrap' :filter='filter'>
          <p slot='header' class='ma-3 subheading font-italic white--text text-uppercase'>
            {{ day.format('dddd') }}
          </p>
          <v-flex slot='item' slot-scope='{ item }' xs12 sm6 md4 lg3>
            <v-hover>
              <v-card slot-scope='{ hover }' :color='sched.colorMap[item.room] + (hover ? "lighten-1" : "")'
                raised height='100%' style='cursor: pointer;' class='elevation-10'
                @click.native='$store.commit("showModal", {ev: item, color: sched.colorMap[item.room]})'>
                <v-card-title class='title'>{{ item.title }}</v-card-title>
                <v-card-text>
                  <p class='caption font-italic font-weight-medium'>{{ item.start.format('h:mm A') }} :: {{ item.room }}</p>
                </v-card-text>
              </v-card>
            </v-hover>
          </v-flex>
        </v-data-iterator>
      </template>
    </v-container>
  </v-card>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator';
import events, { Event } from '@/api/event';
import GridMixin from '@/mixins/grid-mixin';

@Component
export default class Events extends Mixins(GridMixin) {
  public pagination = { rowsPerPage: -1};
  public search: string = '';

  public filter(val: object, search: string): boolean {
    return val != null && typeof val !== 'boolean'
      && val.toString().toLowerCase().indexOf(search) !== -1;
  }

  public customSort(items: Event[],
                    index: undefined | ((a: Event, b: Event) => number),
                    isDescending: boolean): Event[] {
    items.sort(index || events.eventSort);
    if (isDescending) { items.reverse(); }
    return items;
  }

  public get events(): Event[] {
    if (!this.sched) { return []; }
    return this.sched.events;
  }
}
</script>

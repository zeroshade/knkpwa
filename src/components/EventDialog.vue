<template>
  <v-dialog v-model='visible' :width='width'>
    <v-card v-if='modalEvent'>
      <v-card-title :class='`${modalColor} headline`' primary-title>
        <v-icon v-if='modalEvent.icon' class='pr-1' dark>{{ modalEvent.icon }}</v-icon>
        <span style='width: 75%'>{{ modalEvent.title }}</span>
        <v-spacer />
        <v-btn icon @click='toggleStar(modalEvent.id)' v-if='authenticated'>
          <v-icon>{{ userfavs.includes(modalEvent.id) ? 'star' : 'star_border' }}</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-layout fluid>
          <v-flex xs6>
            <p class='font-weight-bold'>
              {{ modalEvent.start.format('h:mm a') }} - {{ modalEvent.end.format('h:mm a') }}
            </p>
          </v-flex>
          <v-flex xs6>
            <p class='font-italic text-xs-right'><strong>Duration:</strong>&nbsp;
              <span v-if='modalEvent.duration.hours()'>{{ modalEvent.duration.hours() }}h</span>
              <span v-if='modalEvent.duration.minutes()'>{{ modalEvent.duration.minutes() }}m</span>
            </p>
          </v-flex>
        </v-layout>
        <v-layout>
          <v-flex xs6>
            <p class='font-weight-medium font-italic'><strong>Room:</strong> {{ modalEvent.room }}</p>
          </v-flex>
          <v-flex xs6>
            <p class='font-weight-medium font-italic text-xs-right'><strong>Organizer:</strong> {{ modalEvent.organizer }}</p>
          </v-flex>
        </v-layout>
        <p v-if='modalEvent.desc' class='font-weight-medium'>{{ modalEvent.desc }}</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Getter, Action } from 'vuex-class';
import { Event } from '@/api/event';

@Component
export default class EventDialog extends Vue {
  @Prop(Number) public width!: number;
  @State('modalEvent') public modalEvent!: Event | null;
  @State('modalColor') public modalColor!: string;
  @Getter('auth/userfavs') public userfavs!: number[];
  @Action('auth/toggleFav') public toggleFav!: (id: number) => void;
  @Getter('auth/authenticated') public authenticated!: boolean;

  public toggleStar(id: number): void {
    if (this.modalEvent === null) { return; }

    const action = (this.userfavs.includes(this.modalEvent.id)) ? 'delfav' : 'addfav';
    this.$ga.event('events', action, this.modalEvent.title);
    this.toggleFav(id);
  }

  public get visible(): boolean {
    return this.$store.state.showModal;
  }

  public set visible(val: boolean) {
    if (val) {
      this.$store.commit('showModal', {});
    } else {
      this.$store.commit('hideModal');
    }
  }

}
</script>

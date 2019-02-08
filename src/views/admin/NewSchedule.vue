<template>
  <v-card>
    <v-card-title class='headline' primary-title>
      Create New Schedule
    </v-card-title>
    <v-form ref='form' v-model='valid' lazy-validation>
      <v-card-text>
        <v-layout wrap align-start justify-space-between>
          <v-flex xs12 md5>
            <v-text-field v-model='title'
              :rules='[required]'
              :counter='50'
              label='Title'
              validate-on-blur
              required />
          </v-flex>
          <v-flex xs12 md5>
            <v-menu
              ref='colormenu'
              v-model='colormenu'
              :close-on-content-click='false'
              :nudge-right='40'
              lazy
              transition='scale-transition'
              full-width
              offset-overflow
              offset-y
            >
              <v-text-field
                label='Default Event Color'
                slot='activator'
                readonly
                :rules='[required]'
                :background-color='defColor'
                :value='defColor' />
              <v-card>
                <v-card-text>
                  <color-chooser v-model='defColor' />
                </v-card-text>
              </v-card>
            </v-menu>
          </v-flex>
          <v-flex xs12 md5>
            <v-menu
              v-model='menustart'
              :close-on-content-click='false'
              full-width
              max-width='290'>
              <v-text-field slot='activator'
                :rules='[required, validStart]'
                :value='formattedStart'
                clearable label='Start' readonly />
              <v-date-picker v-model='start' :max='end' @change='menustart = false' />
            </v-menu>
          </v-flex>
          <v-flex xs12 md5>
            <v-menu
              v-model='menuend'
              :close-on-content-click='false'
              full-width
              max-width='290'>
              <v-text-field slot='activator'
                :rules='[required, validEnd]'
                :value='formattedEnd'
                clearable label='End' readonly />
              <v-date-picker v-model='end' :min='start' @change='menuend = false' />
            </v-menu>
          </v-flex>
        </v-layout>
      </v-card-text>
      <v-card-actions>
        <v-btn @click.native='submit'>Submit</v-btn>
        <v-spacer />
        <v-btn @click.native='this.$refs.form.reset()'>Reset Form</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import { ISchedule } from '@/api/schedule';
import ColorChooser from '@/components/admin/ColorChooser.vue';
import moment from 'moment';

@Component({
  components: {
    ColorChooser,
  },
})
export default class NewSched extends Vue {
  @Action('admin/newSchedule') public addSched!: (s: ISchedule) => Promise<void>;

  public valid = true;
  public title = '';
  public defColor = '';
  public colormenu = false;
  public menustart = false;
  public menuend = false;
  public start = '';
  public end = '';

  public required = (v: string) => !!v || 'Field is Required';
  public validStart(v: string): boolean | string {
    if (!this.end || !v) { return true; }
    return moment(v, 'ddd, MMM Do YYYY').isSameOrBefore(this.end) || 'Must start before end date';
  }

  public validEnd(v: string): boolean | string {
    if (!this.start || !v) { return true; }
    return moment(v, 'ddd, MMM Do YYYY').isSameOrAfter(this.start) || 'Must end before start date';
  }

  public mounted() {
    this.$store.commit('admin/setSched', null);
  }

  public async submit() {
    const form = this.$refs.form as HTMLFormElement;
    if (form.validate()) {
      await this.addSched({id: 0, start: '12:00', numHours: 14,
        dayStart: this.start, dayEnd: this.end, title: this.title,
        defColor: this.defColor, colorMap: {}});
      this.$router.push({name: 'admin'});
    }
  }

  public get formattedStart(): string {
    return this.start ? moment(this.start).format('ddd, MMM Do YYYY') : '';
  }

  public get formattedEnd(): string {
    return this.end ? moment(this.end).format('ddd, MMM Do YYYY') : '';
  }

}
</script>

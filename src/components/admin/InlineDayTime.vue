<template>
  <v-edit-dialog
    ref='editdialog'
    lazy
    large
    persistent
    @open='open()'
    @save='valid() ? $emit("input", saved) && $emit("save") : $emit("cancel")'
    @cancel='$emit("cancel")'
    @close='$emit("close")'>
    {{ formatted }}
    <day-time-input slot='input'
      ref='input'
      :error='!valid()'
      :error-msg='!valid() ? "Invalid Date/Time" : ""'
      v-model='saved' :dayArray='dayArray'
      :label='label' />
  </v-edit-dialog>
</template>

<script lang='ts'>
import { Component, Emit, Vue, Prop } from 'vue-property-decorator';
import DayTimeInput from '@/components/admin/DayTimeInput.vue';
import moment from 'moment';

@Component({
  components: {
    DayTimeInput,
  },
})
export default class InlineDayTime extends Vue {
  @Prop(Date) public value!: Date;
  @Prop(Array) public dayArray!: moment.Moment[];
  @Prop(Date) public minDate!: Date | null;
  @Prop(Date) public maxDate!: Date | null;
  @Prop(String) public format!: string;
  @Prop(String) public label!: string;

  public saved = new Date();
  public get formatted(): string {
    return moment(this.value).format(this.format);
  }

  public valid(): boolean {
    if (this.minDate && moment(this.saved).isSameOrBefore(this.minDate)) { return false; }
    if (this.maxDate && moment(this.saved).isSameOrAfter(this.maxDate)) { return false; }
    return true;
  }

  @Emit()
  public open() {
    this.saved = this.value;
    // if (this.$refs.input) {
    //   (this.$refs.input as DayTimeInput).selected = this.value;
    // }
  }
}
</script>

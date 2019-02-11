<template>
  <v-edit-dialog
    :return-value.sync='saved'
    lazy
    @open='open'
    @save='save'
    @cancel='$emit("cancel")'
    @close='$emit("close")'>
    {{ value }}
    <v-combobox slot='input'
      :rules='[(v) => !!v || "Cannot be empty"]'
      :multiple='multiple'
      :chips='chips'
      v-model='saved'
      :label='label'
      :items='items'></v-combobox>
  </v-edit-dialog>
</template>

<script lang='ts'>
import { Prop, Component, Vue, Emit } from 'vue-property-decorator';

@Component
export default class InlineCombobox extends Vue {
  @Prop(String) public value!: string;
  @Prop(String) public label!: string;
  @Prop(Array) public items!: string[];
  @Prop({default: false}) public multiple!: boolean;
  @Prop({default: false}) public chips!: boolean;

  public saved: string | string[] = '';

  public save() {
    if (this.saved) {
      if (this.multiple) {
        this.$emit('input', (this.saved as string[]).join(', '));
      } else {
        this.$emit('input', this.saved);
      }
      this.$emit('save');
    } else {
      this.$emit('cancel');
    }
  }

  @Emit()
  public open() {
    if (this.multiple) {
      console.log(this.value, this.value.split(','));
      this.saved = this.value.split(',').map((o) => o.trim());
    } else {
      this.saved = this.value;
    }
  }

}
</script>

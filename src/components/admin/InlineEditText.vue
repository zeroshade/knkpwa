<template>
  <v-edit-dialog
    :return-value.sync='saved'
    lazy
    @open='saved = value; $emit("open")'
    @save='saved ? $emit("input", saved) && $emit("save") : $emit("cancel")'
    @cancel='$emit("cancel")'
    @close='$emit("close")'>
    {{ value }}
    <v-text-field slot='input'
      :rules='[(v) => !!v || "Cannot be empty"]'
      v-model='saved'
      :label='label' single-line counter />
  </v-edit-dialog>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class InlineEditText extends Vue {
  @Prop(String) public value!: string;
  @Prop(String) public label!: string;

  public saved = '';
}
</script>

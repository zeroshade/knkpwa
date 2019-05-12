<template>
  <v-menu
    ref='menu'
    v-model='menu'
    :close-on-content-click='false'
    :nudge-right='40'
    lazy
    transition='scale-transition'
    full-width
    offset-overflow
    offset-y
    max-width='225px'
    min-width='225px'
    @input='color.hex = value'
    v-on:update:returnValue='$emit("input", color.hex)'>
    <v-text-field :label='label'
      slot='activator'
      readonly
      :value='color.hex || value' />
    <chrome-picker v-model='color' />
  </v-menu>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Chrome } from 'vue-color';

@Component({
  components: {
    'chrome-picker': Chrome,
  },
})
export default class ColorMenu extends Vue {
  @Prop(String) public value!: string;
  @Prop(String) public label!: string;

  public menu = false;
  public color = {};

}
</script>
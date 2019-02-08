<template>
  <div>
    <p :class='value + "white--text"'>{{ value }}</p>
    <v-select v-model='primary' dense label='Color' :items='colorNames'></v-select>
    <v-select v-model='modifier' dense label='Modifier' :items='modifierNames'></v-select>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace, State } from 'vuex-class';

const admin = namespace('admin');

@Component
export default class ColorChooser extends Vue {
  @Prop(String) public value!: string;
  @admin.State('colorNames') public colorNames!: string[];
  @admin.State('modifierNames') public modifierNames!: string[];

  public get splitVal(): string[] {
    return this.value.split(' ');
  }

  public get primary(): string {
    return this.splitVal[0];
  }
  public set primary(val: string) {
    this.$emit('input', val + ' ' + this.modifier);
  }

  public get modifier(): string {
    return this.splitVal.length > 1 ? this.splitVal[1] : '';
  }
  public set modifier(val: string) {
    this.$emit('input', this.primary + ' ' + val);
  }

}
</script>

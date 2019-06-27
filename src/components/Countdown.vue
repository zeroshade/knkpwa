<template>
  <v-layout :class='textClass' align-center justify-end row>
    <v-flex :style='blockStyle'>
      <p class='digit text-xs-center'
         :style='{...digitStyle, fontSize: `${size}px`}'>{{ hours | twoDigits }}</p>
      <p class='text text-xs-center font-weight-light'
         :style='{...textStyle, fontSize: `${labelSize}px`}'>Hours</p>
    </v-flex>
    <v-flex :style='blockStyle'>
      <p class='digit text-xs-center'
         :style='{...digitStyle, fontSize: `${size}px`}'>{{ minutes | two-digits }}</p>
      <p class='text text-xs-center font-weight-light'
         :style='{...textStyle, fontSize: `${labelSize}px`}'>Minutes</p>
    </v-flex>
    <v-flex :style='blockStyle'>
      <p class='digit text-xs-center'
         :style='{...digitStyle, fontSize: `${size}px`}'>{{ seconds | two-digits }}</p>
      <p class='text text-xs-center font-weight-light'
         :style='{...textStyle, fontSize: `${labelSize}px`}'>Seconds</p>
    </v-flex>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({
  filters: {
    twoDigits(val: number): string { return val.toString().padStart(2, '0'); }
  },
})
export default class Countdown extends Vue {
  @Prop(Date) public readonly date!: Date;
  @Prop(Number) public readonly size!: number;
  @Prop(Number) public readonly labelSize!: number;
  @Prop(Number) public readonly width!: number;
  @Prop(Object) public readonly blockStyle!: {[index: string]: string | number};
  @Prop(Object) public readonly digitStyle!: {[index: string]: string | number};
  @Prop(Object) public readonly textStyle!: {[index: string]: string | number};

  public now = Math.trunc((new Date()).getTime() / 1000);

  public get countFrom(): number {
    return Math.trunc(this.date.getTime() / 1000);
  }

  public get diff(): number {
    return this.countFrom - this.now;
  }

  public get seconds(): number {
    return this.diff % 60;
  }

  public get minutes(): number {
    return Math.trunc(this.diff / 60) % 60;
  }

  public get hours(): number {
    return Math.trunc(this.diff / 3600) % 24;
  }

  public get textClass(): string {
    return this.diff > 0 ? 'green--text text--accent-3' : 'red--text text--lighten-1';
  }

  public mounted() {
    window.setInterval(() => {
      this.now = Math.trunc((new Date()).getTime() / 1000);
    }, 1000);
  }
}
</script>

<style lang='stylus' scoped>
.text
  color #1abc9c
  font-size 20px
  margin-top 10px
  margin-bottom 10px

.digit
  margin 10px
  font-size 40px
</style>

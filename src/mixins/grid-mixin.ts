import { Component, Prop, Vue } from 'vue-property-decorator';
import { Schedule } from '@/api/schedule';
import moment from 'moment';

@Component
export default class GridMixin extends Vue {
  @Prop(Number) public id!: number;
  public pixelHeight = 50;

  public get times(): string[] {
    if (!this.sched) { return []; }
    return this.sched.times();
  }

  public get gridHeight(): number {
    return (this.times.length || 20) * this.pixelHeight;
  }

  public get dateRange(): moment.Moment[] {
    if (!this.sched) { return []; }
    return this.sched.dateRange();
  }

  public get sched(): Schedule {
    const s = this.$store.getters.getScheduleById(this.id);
    if (s) {
      s.loadEvents();
    }
    return s;
  }
}

import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import { Schedule } from '@/api/schedule';
import { Mutation, Action } from 'vuex-class';
import moment from 'moment';

@Component
export default class GridMixin extends Vue {
  @Prop(Number) public id!: number;
  @Action('fetchScheds') public fetchScheds!: () => Promise<void>;
  @Mutation('setCurSchedule') public setSched!: (id: number) => void;

  public pixelHeight = 50;

  public async mounted() {
    await this.fetchScheds();
    this.setSched(this.id);
  }

  @Watch('id')
  public load(val: number) {
    this.setSched(this.id);
  }

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

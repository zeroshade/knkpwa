import moment from 'moment';
import event, { Event } from '@/api/event';

export interface ISchedule {
  id: number;
  start: string;
  numHours: number;
  dayStart: string;
  dayEnd: string;
  title: string;
  defColor: string;
  colorMap: {[index: string]: string};
}

function pick<T, K extends keyof T>(O: T, ...A: K[]) {
  return A.reduce((o, k) => (o[k] = O[k], o), {} as T);
}

export class Schedule {
  public title = '';
  public dayStart: moment.Moment;
  public dayEnd: moment.Moment;
  public id: number = -1;
  public numHours: number = 14;
  public start = '';
  public defColor = '';
  public colorMap: {[index: string]: string} = {};
  public events: Event[] = [];

  constructor(ev: ISchedule) {
    Object.assign(this, pick(ev, 'title', 'id', 'numHours', 'start', 'defColor'));
    this.dayStart = moment(`${ev.dayStart} ${ev.start}`, 'YYYY-MM-DD HH:mm');
    this.dayEnd = moment(`${ev.dayEnd} ${ev.start}`, 'YYYY-MM-DD HH:mm');
    if (ev.colorMap) {
      this.colorMap = ev.colorMap;
    }
    this.colorMap.other = this.defColor;
  }

  public clone(): Schedule {
    const s = new Schedule({
      title: this.title, id: this.id, numHours: this.numHours, start: this.start,
      defColor: this.defColor, dayStart: this.dayStart.format('YYYY-MM-DD'),
      dayEnd: this.dayEnd.format('YYYY-MM-DD'), colorMap: {...this.colorMap},
    });
    return s;
  }

  public getISched(): ISchedule {
    return {
      title: this.title, id: this.id, numHours: this.numHours, start: this.start,
      defColor: this.defColor, dayStart: this.dayStart.format('YYYY-MM-DD'),
      dayEnd: this.dayEnd.format('YYYY-MM-DD'), colorMap: this.colorMap,
    };
  }

  public dateRange(): moment.Moment[] {
    const res: moment.Moment[] = [];
    for (const m = this.dayStart.clone(); m.isBefore(this.dayEnd); m.add(1, 'day')) {
      res.push(m.clone());
    }
    res.push(this.dayEnd.clone());
    return res;
  }

  public times(): string[] {
    const res: string[] = [];
    const start = moment(this.start, 'HH:mm');
    const end = start.clone().add(this.numHours, 'hours');
    for (const m = start; m.isBefore(end); m.add(30, 'm')) {
      res.push(m.format('h A'));
    }
    res.push(end.format('h A'));
    return res;
  }

  public async loadEvents(): Promise<void> {
    if (this.events.length !== 0) { return; }
    this.events = await event.getEvents(this.id);
  }
}

export default {
  async getSchedules(): Promise<Schedule[]> {
    const resp = await fetch(process.env.VUE_APP_BACKEND_HOST + '/scheds');
    const schedules = await resp.json();
    return schedules.map((s: ISchedule) => new Schedule(s));
  },
  async getSchedule(id: number): Promise<Schedule> {
    const resp = await fetch(process.env.VUE_APP_BACKEND_HOST + `/scheds/${id}`);
    return new Schedule(await resp.json());
  },
};

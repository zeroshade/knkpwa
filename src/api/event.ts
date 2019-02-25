import moment from 'moment';

export interface IEvent {
  startTime: string;
  endTime: string;
  day: string;
  title: string;
  room: string;
  icon?: string;
  id: number;
  schedId: number;
  desc?: string;
  organizer: string;
  hideAgenda?: boolean;
}

export class Event {
  public title = '';
  public room = '';
  public icon = '';
  public id: number = -1;
  public schedId: number = -1;
  public organizer = '';
  public desc = '';
  public favorited: boolean | null = null;
  public hideAgenda = false;
  public start: moment.Moment;
  public end: moment.Moment;
  public draft = false;

  constructor(ev?: IEvent) {
    if (!ev) {
      this.start = moment();
      this.end = moment().add(1, 'h');
      return;
    }

    Object.assign(this, ev);

    this.start = moment(`${ev.day} ${ev.startTime}`, 'YYYY-MM-DD h:mm A');
    if (this.start.hours() <= 3) { this.start.add(1, 'day'); }

    this.end = moment(`${ev.day} ${ev.endTime}`, 'YYYY-MM-DD h:mm A');
    if (this.end.hours() <= 3) { this.end.add(1, 'day'); }
  }

  public get duration(): moment.Duration {
    return moment.duration(this.end.diff(this.start));
  }

  public clear() {
    this.title = '';
    this.room = '';
    this.icon = '';
    this.id = -1;
    this.organizer = '';
    this.desc = '';
    this.end = this.start.clone().add(1, 'h');
  }

  public getIEvent(): IEvent {
    const day = (this.start.hours() <= 3) ? this.start.clone().subtract(1, 'd').format('YYYY-MM-DD')
      : this.start.format('YYYY-MM-DD');
    return {
      title: this.title, room: this.room, icon: this.icon,
      id: this.id, schedId: this.schedId, organizer: this.organizer,
      desc: this.desc, hideAgenda: this.hideAgenda,
      day, startTime: this.start.format('h:mm A'),
      endTime: this.end.format('h:mm A'),
    };
  }
}

function eventSort(a: Event, b: Event): number {
  if (a.start.isSame(b.start)) {
    return a.duration.asMinutes() - b.duration.asMinutes();
  }
  return a.start.isBefore(b.start) ? -1 : 1;
}

export type MinToPixelFunc = (minutes: number | string) => number;

export default {
  async getEvents(schedId: number): Promise<Event[]> {
    const resp = await fetch(process.env.VUE_APP_BACKEND_HOST + `/scheds/${schedId}/events`);
    const events = await resp.json();
    return events.map((e: IEvent) => new Event(e));
  },
  eventSort,
  eventCols(events: Event[]): Event[][] {
    const cols: Event[][] = [];
    for (const ev of events) {
      let placed = false;
      for (const c of cols) {
        const lastEvent = c[c.length - 1];
        if (ev.start.isSameOrAfter(lastEvent.end)) {
          c.push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) { cols.push([ev]); }
    }
    return cols;
  },
  orderEvents(eventList: Event[]): Event[][] {
    const res: Event[][] = [];
    let cur: Event[] = [];

    eventList.sort(eventSort);

    let curEnd: moment.Moment | null = null;
    for (const current of eventList) {
      if (cur.length === 0) {
        cur.push(current);
        curEnd = cur[0].end.clone();
        continue;
      }

      if (current.start.isBetween(cur[0].start, curEnd as moment.Moment, undefined, '[)')) {
        cur.push(current);
        const end = current.end.clone();
        if (end.isAfter(curEnd as moment.Moment)) {
          curEnd = end;
        }
        continue;
      }

      res.push(cur);
      cur = [current];
      curEnd = current.end.clone();
    }
    if (cur.length) {
      res.push(cur);
    }
    return res;
  },
  colItems(col: Event[], minutesToPixels: MinToPixelFunc): Array<{ev: Event, margin: number}> {
    const res: Array<{ev: Event, margin: number}> = [];
    for (const ev of col) {
      if (!res.length) {
        res.push({ev, margin: 0});
        continue;
      }
      const lastEvent = res[res.length - 1].ev;
      res.push({ev, margin: minutesToPixels(ev.start.diff(lastEvent.end, 'minutes'))});
    }
    return res;
  },
};

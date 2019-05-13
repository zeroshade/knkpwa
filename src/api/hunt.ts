import { uuid } from 'vue-uuid';

export class Clue {
  public id = '';
  public title = '';
  public text = '';
  public huntId = -1;
  public bgColor = '#FFF';
  public color = '#000';

  constructor(title: string, text: string, huntId: number, id?: string, color?: string, bgColor?: string) {
    this.id = id || uuid.v4();
    this.title = title;
    this.text = text;
    this.huntId = huntId;

    if (color) {
      this.color = color;
    }
    if (bgColor) {
      this.bgColor = bgColor;
    }
  }

  public clone(): Clue {
    return new Clue(this.title, this.text, this.huntId, this.id, this.color, this.bgColor);
  }

  public key(): string {
    return this.id + this.color + this.bgColor;
  }
}

export interface IClue {
  id: string;
  title: string;
  text: string;
  huntId: number;
  color: string;
  bgColor: string;
}

export interface IHunt {
  id: number;
  title: string;
  desc: string;
  clues: IClue[];
}

interface NumClues {
  numClues: number;
}

export type HuntInfo = IHunt & NumClues;

export class Hunt {
  public id: number = -1;
  public title: string = '';
  public desc: string = '';
  public clues: Clue[] = [];

  constructor(h?: IHunt) {
    if (!h) { return; }

    this.id = h.id;
    this.title = h.title;
    this.desc = h.desc;
    if (h.clues) {
      for (const c of h.clues) {
        this.clues.push(new Clue(c.title, c.text, c.huntId, c.id, c.color, c.bgColor));
      }
    }
  }
}

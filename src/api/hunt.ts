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

export interface MapPiece {
  id: number;
  title: string;
  class: string;
  top: number;
  left: number;
  width: number;
  height: number;
  clues: string[];
  huntId: number;
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
  type: string;
  mapPieces: MapPiece[];
  answers: Solution[];
}

interface NumClues {
  numClues: number;
}

interface NumMaps {
  numMaps: number;
}

export type HuntInfo = IHunt & NumClues & NumMaps;

export interface Solution {
  title: string;
  solution: number;
  options: string[];
  huntId: number;
}

export class Hunt {
  public id: number = -1;
  public title: string = '';
  public desc: string = '';
  public clues: Clue[] = [];
  public type: string = '';
  public mapPieces: MapPiece[] = [];
  public answers: Solution[] = [];

  constructor(h?: IHunt) {
    if (!h) { return; }

    const {id, title, desc, type, mapPieces, answers} = h;
    Object.assign(this, {id, title, desc, type, mapPieces, answers});

    if (h.clues) {
      for (const c of h.clues) {
        this.clues.push(new Clue(c.title, c.text, c.huntId, c.id, c.color, c.bgColor));
      }
    }
  }
}

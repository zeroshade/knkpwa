<template>
  <v-container fluid>
    <v-layout wrap>
      <v-flex xs12>
        <v-stepper alt-labels v-model='huntStep' v-if='huntList.length > 0'>
          <v-stepper-header>
            <v-stepper-step :complete='huntStep > 1' step='1'>{{ huntList[0].title }}</v-stepper-step>
            <v-divider />
            <v-stepper-step :complete='huntStep > 2' step='2'>{{ huntList[1].title }}</v-stepper-step>
            <v-divider />
            <v-stepper-step :complete='huntStep > 3' step='3'>Solved!</v-stepper-step>
          </v-stepper-header>
          <v-stepper-items>
            <v-stepper-content v-for='(hunt, idx) in huntList' :key='`${idx}--content`' :step='idx + 1'>
              <v-card class='mb-4'>
                <v-card-title v-if='huntList.length > 0'>
                  <p class='title'>{{ hunt.title }}</p>
                  <v-spacer />
                  <countdown v-if='huntStep > 1' :date='deadline()'
                    style='max-width: 300px' :size='40' :label-size='20'></countdown>
                </v-card-title>
                <v-toolbar card color='grey darken-2'>
                  <p class='mb-0 mt-1 ml-2 font-weight-light text-capitalize'>
                    <u @click='viewDesc = true'>view hunt description</u>
                  </p>
                  <p class='mb-0 mt-1 ml-2 font-weight-light text-capitalize'>
                    <u @click='viewFull = true'>view hunt map</u>
                  </p>
                  <v-spacer />
                  <v-btn icon @click='clueDialog = true'>
                    <v-icon>camera_rear</v-icon>
                  </v-btn>
                </v-toolbar>
                <v-card-text>
                  <v-treeview
                    :items='[
                      {title: "Clues Found (tap to see!)", children: curUserClues, id: "clues"},
                      {title: "Map Pieces Revealed", children: piecesFound, id: "mapPieces"},
                    ]'
                    item-children='children'
                    item-text='title'
                    open-on-click>
                    <template v-slot:append='{ item, leaf }'>
                      <v-progress-circular v-if='!leaf'
                        rotate='-90'
                        color='blue'
                        :value='perc(item)'>
                        {{ perc(item) }}%
                      </v-progress-circular>
                    </template>
                    <template v-slot:label='{ item, leaf }'>
                      <span v-if='!leaf'>{{ item.title }}</span>
                      <p v-else-if='!item.hasOwnProperty("left")'>
                        <u @click='active = [item.id]; cluePopup = !cluePopup'>{{ item.title }}</u>
                      </p>
                      <p v-else>{{ item.title }}</p>
                    </template>
                  </v-treeview>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn @click='openGuess()'>Make A Guess!</v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>
            <v-stepper-content step='3'>
              <v-card>
                <v-card-title>
                  <p class='headline mb-0 purple--text text--lighten-3'>Success!</p>
                </v-card-title>
                <v-divider />
                <v-card-text v-if='this.curStatus.length >= 2'>
                  <div v-if='deadline() >= this.curStatus[1].when'>
                    <p>You arrive just in time to evacuate your desperate crew. As you get them settled into
                      sick bay, a <strong>Tal Shiar Bird of Prey</strong> drops out of hyperspace in orbit
                      above the planet. Before you can return to the shuttle pod to recover your spoils, the
                      <strong>Bird of Prey</strong> fires a pair of photon torpedos, destroying the wreckage.</p>

                    <p><em>"Captain, they're hailing us."</em></p>

                    <p><strong>Senator Cretak's</strong> imperious scowl appears on your viewscreen.</p>

                    <p><em>"If the Romulan Empire cannot have the artifact, no one can. Now take your crew and
                        leave, while I allow it."</em></p>

                    <p>Not needing to be told twice, you order the <em>Spaceship KnK</em> to leave the
                      <strong>B'Hala Cluster</strong> at top speed. As you gaze out your viewscreen at the
                      triple-sunset of the <strong>B'Hala Cluster</strong> over the rapidly fading horizon
                      of the <strong>4th planet</strong>, you contemplate how fortunate you are
                      to have recovered your crew and your ship. You will live to see another adventure.</p>

                    <p><strong><em>Congratulations!</em></strong> You have completed the KnK Planet X Marks The
                      Hunt! You found {{ totalCluePerc }}% of the clues and finished with
                      {{ round(((deadline() - this.curStatus[1].when) / 60000), 1) }} minutes
                      left!</p>
                  </div>
                  <div v-else>
                    <p>You arrive on the <strong>4th planet</strong> of the <strong>B'Hala Cluster</strong> only
                      to encounter a <strong>Tal Shiar Bird of Prey</strong> decending on the crash site. You
                      have arrived too late! After a pitched battle, you finally destroy the shields of the
                      <strong>Romulan</strong> craft and send the <strong>Tal Shiar</strong> running, only to
                      discover that your hyperspace interpolator was destroyed in the firefight. Your ship is
                      incapable of leaving the planet's orbit</p>

                    <p>You have found the <strong>lost treasure of Eav'oq</strong>, but it has cost you
                      <em>everything</em>. You gaze in wonder at the beautiful triple-sunset afforded by the
                      <strong>B'Hala Cluster</strong> as you and your reunited crew slowly succumb to radiation
                      poisoning.</p>

                    <p><strong><em>Congratulations!</em></strong> You have completed the KnK Planet X Marks The
                      Hunt! You Found {{ totalCluePerc }}% of the clues and correctly solved the puzzle!</p>
                  </div>
                </v-card-text>
              </v-card>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-flex>
    </v-layout>
    <v-dialog lazy v-model='cluePopup' max-width='500'>
      <v-card v-if='viewClue'>
        <v-card-title>
          <p class='title text-capitalize mb-0'>{{ viewClue.title }}</p>
          <v-spacer />
          <v-btn icon small @click='cluePopup = !cluePopup'><v-icon>close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          {{ viewClue.text }}
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog lazy persistent v-model='guessDiag' max-width='400'>
      <v-card>
        <v-card-title><p class='mb-0 title text-capitalize'>did you figure it out?</p></v-card-title>
        <v-divider />
        <v-card-text>
          <p v-if='huntStep === 2'>Travelling between orbits requires an extended thruster burn, choose
            carefully! A wrong guess will cost you an hour of travel time!</p>
          <v-list two-line>
            <v-list-tile v-for='(item, index) in guessOptions' :key='index'>
              <v-list-tile-content>
                <v-select :items='item.options' :label='item.title' v-model='guesses[index]' />
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn @click='guessDiag = false'>Cancel</v-btn>
          <v-spacer />
          <v-btn :disabled='checkInvalid' @click='checkGuess()'>Check Guess</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog lazy v-model='viewDesc' max-width='500'>
      <v-card>
        <v-card-title>
          <p class='title'>Hunt Description</p>
          <v-spacer />
          <v-btn icon @click='viewDesc = false'>
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text v-if='huntList.length > 0 && huntStep <= huntList.length'>
          {{ huntList[huntStep - 1].desc }}
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog lazy v-model='viewFull' max-width='500'>
      <v-card v-if='huntList.length > 0 && huntStep <= huntList.length'>
        <v-btn class='mt-4' color='red darken-4' fab small top right absolute @click='viewFull = !viewFull'>
          <v-icon>close</v-icon>
        </v-btn>
        <div class='dragbox grab' style='width: 100%; height: 500px;' v-dragscroll>
          <ul id='star_map' :style='{
            width: `${huntList[huntStep - 1].mapWidth}px`,
            height: `${huntList[huntStep - 1].mapHeight}px`,
            backgroundImage: `url("/img/${huntList[huntStep - 1].mapImg}.png")`}'>
            <li v-for='p in piecesFound' :key='p.id'
              :style='getClueStyle(p)'
              :class='p.class'></li>
          </ul>
        </div>
      </v-card>
    </v-dialog>
    <v-snackbar v-model='foundSnack' top :timeout='20000'>
      {{ foundText }}
      <v-btn color='pink' flat @click='foundSnack = false'>
        Close
      </v-btn>
    </v-snackbar>
    <v-dialog lazy v-model='clueDialog' max-width='500'>
      <v-card>
        <v-card-title class='headline pb-2'>Register New Clue</v-card-title>
        <v-divider />
        <v-card-text>
          <qrcode-drop-zone v-if='!mobile' @dragover='onDragOver' @decode='onDecode'>
            <div class='drop-area' :class='{ "dragover": isDragging }'>
              DROP IMAGE
            </div>
          </qrcode-drop-zone>
          <qrcode-stream class='drop-area' style='height: 270px' v-else-if='clueDialog' @decode='onDecode'>
          </qrcode-stream>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn @click='clueDialog = false'>
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { QrcodeDropZone, QrcodeStream } from 'vue-qrcode-reader';
import { Clue, Hunt, HuntInfo, MapPiece, Solution, Solve } from '@/api/hunt';
import { Action } from 'vuex-class';
import { isMobile } from 'mobile-device-detect';
import { isUndefined } from 'util';
import Countdown from '@/components/Countdown.vue';

interface Guess {
  title: string;
  guess: number;
}

interface SolveResponse {
  solves: Solve[];
  attempts: {[index: number]: number};
}

@Component({
  components: {
    QrcodeDropZone,
    QrcodeStream,
    Countdown,
  },
})
export default class ScavengerView extends Vue {
  @Action('scavenger/getClueByID') public getClue!: (id: string) => Promise<Clue>;
  @Action('scavenger/getUserClues') public getUserClues!: () => Promise<Clue[]>;
  @Action('scavenger/getHuntInfo') public getHuntList!: () => Promise<HuntInfo[]>;
  @Action('scavenger/addUserClue') public addUserClue!: (payload: {clueId: string, huntId: number}) => Promise<boolean>;
  @Action('scavenger/getMapPieceInfo') public getMapPieces!: () => Promise<MapPiece[]>;
  @Action('scavenger/getOptions') public getOptions!: (id: number) => Promise<Solution[]>;
  @Action('scavenger/addSolve') public addSolve!: (payload: {huntId: number, solve: Guess[]}) => Promise<boolean>;
  @Action('scavenger/getSolved') public getSolved!: () => Promise<SolveResponse>;
  @Action('scavenger/failedAttempt') public failed!: (huntId: number) => Promise<void>;

  public isDragging = false;
  public clueDialog = false;
  public viewFull = false;
  public clue: Clue | null = null;
  public userClues: Clue[] = [];
  public huntList: HuntInfo[] = [];
  public active: string[] = [];
  public pieces: MapPiece[] = [];
  public dragging = false;
  public foundText = '';
  public foundSnack = false;
  public viewDesc = false;
  public huntStep = 1;
  public guessDiag = false;
  public guessOptions: Solution[] = [];
  public guesses: string[] = [];
  public cluePopup = false;
  public curStatus: Solve[] = [];
  public failedAttempts: {[index: number]: number} = {};

  public get viewClue(): Clue | null {
    if (this.active.length === 0) { return null; }

    return this.userClues[this.userClues.findIndex((c) => c.id === this.active[0])];
  }

  public get mobile(): boolean {
    return isMobile;
  }

  public get piecesFound(): MapPiece[] {
    return this.pieces.filter((p) => p.clues.length > 0 &&
      p.clues.every((c: string) => -1 !== this.curUserClues.findIndex((uc) => uc.id === c)),
    );
  }

  public get curUserClues(): Clue[] {
    return this.userClues.filter((c) => c.huntId === this.huntStep);
  }

  public deadline(): Date {
    const ret = new Date(this.curStatus[0].when);
    let numHours = 3;

    if (2 in this.failedAttempts) {
      numHours -= this.failedAttempts[2];
    }
    ret.setTime(ret.getTime() + (numHours * 3600 * 1000));
    return ret;
  }

  public async openGuess() {
    this.guessOptions = await this.getOptions(this.huntStep);
    this.guesses = Array(this.guessOptions.length);
    this.guessDiag = true;
  }

  public async checkGuess() {
    const solve = this.guessOptions.map(
      (val, i) => ({ title: val.title, guess: val.options.findIndex((o) => o === this.guesses[i]) }));

    const huntId = this.huntList[this.huntStep - 1].id;
    if (this.guessOptions.every((val, i) => val.solution === solve[i].guess)) {
      this.foundText = (this.huntStep === 1)
        ? 'Congrats! Now for Part II!'
        : 'Success!';

      if (await this.addSolve({ huntId, solve })) {
        const {solves, attempts} = await this.getSolved();
        this.curStatus = solves;
        this.failedAttempts = attempts;
        this.huntStep += 1;
        if (this.huntStep === 2) {
          this.viewDesc = true;
        }
      }
    } else {
      this.foundText = (this.huntStep === 1)
        ? 'Sorry! Try Again!'
        : 'You didn\'t find your crew. An hour was wasted departing the orbit, your time left has been updated.';

      if (huntId in this.failedAttempts) {
        this.failedAttempts[huntId] += 1;
      } else {
        this.failedAttempts[huntId] = 1;
      }
      this.failed(huntId);
    }

    this.foundSnack = true;
    this.guessDiag = false;
  }

  public get checkInvalid(): boolean {
    for (const g of this.guesses) {
      if (!g) { return true; }
    }
    return false;
  }

  public round(val: number, dec: number): number {
    return Number(Math.round(Number(val + 'e' + dec)) + 'e-' + dec);
  }

  public async init() {
    this.userClues = await this.getUserClues();
    this.huntList = await this.getHuntList();
    this.getMapPieces().then((p) => {
      this.pieces = p;
    });
    const {solves, attempts} = await this.getSolved();
    this.curStatus = solves;
    this.failedAttempts = attempts;

    for (const c of this.userClues) {
      const idx = this.huntList.findIndex((h) => h.id === c.huntId);
      if (idx === -1) { continue; }
      if (!('clues' in this.huntList[idx])) {
        this.huntList[idx].clues = [];
      }
      this.huntList[idx].clues.push(c);
    }

    for (const h of this.huntList) {
      if (!('clues' in h)) {
        h.clues = [];
      }
      h.clues = h.clues.sort((a, b) => a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
      for (let c = h.clues.length; c < h.numClues; c++) {
        h.clues.push(new Clue('???', '', h.id, String(h.id + c + 100)));
      }
    }

    this.huntStep = this.curStatus.length + 1;
  }

  public async mounted() {
    await this.init();
  }

  public perc(item: {id: string}): number {
    if (this.huntList.length === 0 || this.huntStep > this.huntList.length) { return 0; }
    if (item.id === 'clues') {
      return Math.round(this.curUserClues.length / this.huntList[this.huntStep - 1].numClues * 100);
    } else if (item.id === 'mapPieces') {
      return Math.round(this.piecesFound.length / this.huntList[this.huntStep - 1].numMaps * 100);
    } else {
      return 0;
    }
  }

  public get totalCluePerc(): number {
    const total = this.huntList.reduce((acc: number, h: HuntInfo) => acc + h.numClues, 0);
    return this.round((this.userClues.length / total) * 100, 2);
  }

  public clueFound(id: string): boolean {
    return this.userClues.findIndex((c) => c.id === id) !== -1;
  }

  public onDragOver(dragging: boolean) {
    this.isDragging = dragging;
  }

  public async onDecode(decoded: string) {
    if (this.clueFound(decoded)) {
      this.foundText = 'You\'ve already found this one!!';
      this.active = [decoded];
    } else {
      const success = await this.addUserClue({clueId: decoded, huntId: this.huntStep});
      if (success) {
        await this.init();
        this.active = [decoded];
        this.foundText = 'New Clue Found!';
      } else {
        this.foundText = 'Re-Scan this after solving Part 1!';
      }
    }
    this.foundSnack = true;
    this.clueDialog = false;
  }

  public getClueStyle(m: MapPiece): {[index: string]: string} | null {
    return {
      top: m.top + 'px',
      left: m.left + 'px',
      width: m.width + 'px',
      height: m.height + 'px',
    };
  }
}
</script>

<style lang="stylus" scoped>
.drop-area
  height: 200px
  width: 200px
  color: #fff
  margin: 0 auto
  text-align: center
  font-weight: bold
  padding: 10px
  background-color: rgba(0, 0, 0, 0.5)

.dragover
  background-color: rgba(0, 0, 0, 0.8)

.grab
  cursor: -webkit-grab
  cursor: -moz-grab
  cursor: grab

.dragbox
  overflow hidden

ul#star_map

  background-size contain
  list-style none
  margin 0
  padding 0
  position relative

  li
    position absolute

p > u
  cursor pointer
  text-decoration-style dashed
  text-underline-position under

.none
  background-image url('/img/none.svg')

.alliance
  background-image url('/img/alliance.svg')

.yeerk
  background-image url('/img/yeerk.svg')

.imperial
  background-image url('/img/imperial.svg')

.republic
  background-image url('/img/republic.svg')

.dalek
  background-image url('/img/dalek.svg')

.maquis
  background-image url('/img/maquis.svg')

.breen
  background-image url('/img/breen.svg')

.borg
  background-image url('/img/borg.svg')

.talshiar
  background-image url('/img/talshiar.svg')

.orion
  background-image url('/img/orion.svg')

</style>

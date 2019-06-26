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
            <v-stepper-content step='1'>
              <v-card class='mb-4'>
                <v-card-title v-if='huntList.length > 0'>
                  <p class='title'>{{ huntList[0].title }}</p>
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
                <v-layout wrap>
                  <v-flex>
                    <v-card-text>
                      <v-treeview
                        activatable
                        :active.sync='active'
                        :items='[
                          {title: "Clues Found (tap to see!)", children: userClues, id: "clues"},
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
                      </v-treeview>
                    </v-card-text>
                  </v-flex>
                  <v-divider vertical />
                  <v-flex xs12 md6>
                    <v-card-text>
                      <p v-if='viewClue' class='title'>Clue Text:</p>
                      <p v-if='viewClue'>
                        {{viewClue.text}}
                      </p>
                    </v-card-text>
                  </v-flex>
                </v-layout>
                <v-card-actions>
                  <v-spacer />
                  <v-btn>Make A Guess! &nbsp;&nbsp; <small>Doesn't work yet</small></v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-content>
            <v-stepper-content step='2'>
            </v-stepper-content>
            <v-stepper-content step='3'>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-flex>
    </v-layout>
    <v-dialog lazy v-model='viewDesc' max-width='500'>
      <v-card>
        <v-card-title>
          <p class='title'>Hunt Description</p>
        </v-card-title>
        <v-card-text v-if='huntList.length > 0'>
          {{ huntList[0].desc }}
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog lazy v-model='viewFull' max-width='500'>
      <v-card>
        <div class='dragbox grab' style='width: 100%; height: 500px;' v-dragscroll>
          <ul id='star_map'>
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
import { Clue, Hunt, HuntInfo, MapPiece } from '@/api/hunt';
import { Action } from 'vuex-class';
import { isMobile } from 'mobile-device-detect';
import { isUndefined } from 'util';

@Component({
  components: {
    QrcodeDropZone,
    QrcodeStream,
  },
})
export default class ScavengerView extends Vue {
  @Action('scavenger/getClueByID') public getClue!: (id: string) => Promise<Clue>;
  @Action('scavenger/getUserClues') public getUserClues!: () => Promise<Clue[]>;
  @Action('scavenger/getHuntInfo') public getHuntList!: () => Promise<HuntInfo[]>;
  @Action('scavenger/addUserClue') public addUserClue!: (id: string) => Promise<boolean>;
  @Action('scavenger/getMapPieceInfo') public getMapPieces!: () => Promise<MapPiece[]>;

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

  public get viewClue(): Clue | null {
    if (this.active.length === 0) { return null; }

    return this.userClues[this.userClues.findIndex((c) => c.id === this.active[0])];
  }

  public get mobile(): boolean {
    return isMobile;
  }

  public get piecesFound(): MapPiece[] {
    return this.pieces.filter((p) => p.clues.length > 0 &&
      p.clues.every((c: string) => -1 !== this.userClues.findIndex((uc) => uc.id === c))
    );
  }

  public async init() {
    this.userClues = await this.getUserClues();
    this.huntList = await this.getHuntList();

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

    this.pieces = await this.getMapPieces();
  }

  public async mounted() {
    await this.init();
  }

  public log(msg: string) {
    console.log(msg);
  }

  public perc(item: {id: string}): number {
    if (this.huntList.length === 0) { return 0; }
    if (item.id === 'clues') {
      return Math.round(this.userClues.length / this.huntList[0].numClues * 100);
    } else if (item.id === 'mapPieces') {
      return Math.round(this.piecesFound.length / this.huntList[0].numMaps * 100);
    } else {
      return 0;
    }
  }

  public percFound(h: HuntInfo): number {
    const i = h.clues.reduce((acc, cv) => acc + ((cv.title !== '???') ? 1 : 0), 0);
    return i / h.numClues * 100;
  }

  public clueFound(id: string): boolean {
    return this.userClues.findIndex((c) => c.id === id) !== -1;
  }

  public onDragOver(dragging: boolean) {
    this.isDragging = dragging;
  }

  public async onDecode(decoded: string) {
    console.log(decoded);
    if (this.clueFound(decoded)) {
      this.foundText = 'You\'ve already found this one!!';
      this.active = [decoded];
    } else {
      const success = await this.addUserClue(decoded);
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
  width 1500px
  height 725.47px
  background-image url('/img/star_map.png')
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

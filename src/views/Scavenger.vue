<template>
  <v-container fluid>
    <v-layout wrap>
      <v-flex xs12>
        <v-card class='mb-4'>
          <v-toolbar card color='grey darken-2'>
            <v-toolbar-title>Scavenger Hunt Clues</v-toolbar-title>
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
                  item-children='clues'
                  item-text='title'
                  open-on-click
                  :open='huntList.map((h) => h.id)'
                  :items='huntList'>
                  <template v-slot:append='{ item, leaf }'>
                    <v-progress-circular v-if='!leaf'
                      rotate='-90'
                      color='blue'
                      :value='percFound(item)' />
                  </template>
                </v-treeview>
              </v-card-text>
            </v-flex>
            <v-divider vertical />
            <v-flex xs12 md6>
              <v-card-text>
                <p v-if='viewClue'>{{viewClue.text}}</p>
              </v-card-text>
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
    <v-dialog lazy persistent v-model='clueDialog' max-width='500'>
      <v-card>
        <v-card-title class='headline pb-2'>Register New Clue</v-card-title>
        <v-divider />
        <v-card-text>
          <p v-if='foundText'>{{ foundText }}</p>
          <qrcode-drop-zone v-if='!mobile' @dragover='onDragOver' @decode='onDecode'>
            <div class='drop-area' :class='{ "dragover": isDragging }'>
              DROP IMAGE
            </div>
          </qrcode-drop-zone>
          <qrcode-stream class='drop-area' style='height: 270px' v-else @decode='onDecode'>
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
import { Clue, Hunt, HuntInfo } from '@/api/hunt';
import { Action } from 'vuex-class';
import { isMobile } from 'mobile-device-detect';

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
  @Action('scavenger/addUserClue') public addUserClue!: (id: string) => Promise<void>;

  public isDragging = false;
  public clueDialog = false;
  public clue: Clue | null = null;
  public userClues: Clue[] = [];
  public huntList: HuntInfo[] = [];
  public active: string[] = [];
  public foundText = '';

  public get viewClue(): Clue | null {
    if (this.active.length === 0) { return null; }

    return this.userClues[this.userClues.findIndex((c) => c.id === this.active[0])];
  }

  public get mobile(): boolean {
    return isMobile;
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
      h.clues = h.clues.sort((a, b) => a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
      for (let c = h.clues.length; c < h.numClues; c++) {
        h.clues.push(new Clue('???', '', h.id, String(h.id + c + 100)));
      }
    }
  }

  public async mounted() {
    await this.init();
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
    if (this.clueFound(decoded)) {
      this.foundText = 'You\'ve already found this one!!';
    } else {
      await this.addUserClue(decoded);
      await this.init();
      this.foundText = 'New Clue Found!';
    }
    this.active = [decoded];
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
</style>

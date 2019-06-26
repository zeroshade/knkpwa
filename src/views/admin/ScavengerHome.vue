<template>
  <v-layout wrap>
    <v-flex xs7>
      <v-card class='mb-3'>
        <v-card-title primary-title>
          <div>
            <div class='headline'><strong>Hunt:</strong>
              <em>{{ curHunt.title }}</em>
            </div>
            <span><strong>Description:</strong> {{curHunt.desc}}</span>
          </div>
          <v-spacer />
          <v-btn @click='huntEdit()'>Rename</v-btn>
        </v-card-title>
        <v-card-text>
          <img class='zoomimg' @click='zoomimg = true' :src='`/img/${curHunt.mapImg}_complete.png`' />
          <v-dialog v-model='zoomimg' transition='scale-transition' lazy max-width='500'>
            <v-card>
              <div v-dragscroll style='width: 100%; height: 500px; overflow: hidden; cursor: grab;'>
                <ul id='map' :style='{backgroundImage: `url("/img/${curHunt.mapImg}_complete.png")`}' style='width: 1500px; height: 875px;'>
                </ul>
              </div>
            </v-card>
          </v-dialog>
        </v-card-text>
      </v-card>
    </v-flex>
    <v-flex offset-xs1 xs4>
      <v-card class='mb-3'>
        <v-card-title primary-title class='mb-0 pb-0'>
          <p class='headline'><strong>Solution</strong></p>
        </v-card-title>
        <v-card-text>
          <v-list two-line dense>
            <v-subheader>
              Solution Parts
              <v-btn icon small @click='curHunt.answers.push({huntId: curHunt.id, title: "New", solution: 0, options: ["Opt 1"]})'>
                <v-icon>add_circle_outline</v-icon>
              </v-btn>
            </v-subheader>
            <v-list-tile avatar
              v-for='(item, index) in curHunt.answers'
              :key='index'>
              <v-list-tile-action>
                <v-btn icon @click='editSolution(index)'>
                  <v-icon>edit</v-icon>
                </v-btn>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>{{item.title}}</v-list-tile-title>
                <v-list-tile-sub-title>Answer: {{item.options[item.solution] }}</v-list-tile-sub-title>
              </v-list-tile-content>

              <v-list-tile-avatar v-if='curHunt.answers.length > 1'>
                <v-btn icon small @click='curHunt.answers.splice(index, 1); saveAnswers({answers: curHunt.answers, id: curHunt.id});'>
                  <v-icon small>delete</v-icon>
                </v-btn>
              </v-list-tile-avatar>
            </v-list-tile>
          </v-list>
        </v-card-text>
      </v-card>
      <v-dialog lazy v-model='solutionDialog' max-width='500'>
        <v-card>
          <v-card-title class='headline pb-1'>Edit Solution Answer</v-card-title>
          <v-divider />
          <v-card-text>
            <v-text-field label='Title' v-model='tmpSolution.title' />
            <v-radio-group v-model='tmpSolution.solution'>
              <template v-slot:label>
                <div>
                  Choose the solution from options:
                  <v-tooltip right>
                    <template v-slot:activator="{ on }">
                      <v-icon v-on='on' class='pb-1' small @click='tmpSolution.options.push(`Opt ${tmpSolution.options.length}`)'>add</v-icon>
                    </template>
                    <span>Add New Option</span>
                  </v-tooltip>
                </div>
              </template>
              <v-radio v-for='(val, idx) in tmpSolution.options' :key='idx' :value='idx'>
                <template v-slot:label>
                  <v-hover v-if='editorIdx != idx'>
                    <div slot-scope='{ hover }'>
                      {{ val }}
                      <v-tooltip top>
                        <template v-slot:activator='{ on }'>
                          <v-icon v-on='on' class='pb-1 pr-1' small @click.stop.prevent='editorIdx = idx' v-if='hover'>
                            edit
                          </v-icon>
                        </template>
                        <span>Edit Option</span>
                      </v-tooltip>
                      <v-tooltip top>
                        <template v-slot:activator='{ on }'>
                          <v-icon v-on='on' class='pb-1' small @click='removeOpt(val)' v-if='hover'>
                            delete
                          </v-icon>
                        </template>
                        <span>Delete Option</span>
                      </v-tooltip>
                    </div>
                  </v-hover>
                  <v-text-field v-else append-outer-icon='save' autofocus
                    @click:append-outer='saveOpt()' @blur='saveOpt()'
                    class='mb-0 mt-0 pt-0' v-model='tmpSolution.options[idx]'
                    style='height: 30px' />
                </template>
              </v-radio>
            </v-radio-group>
          </v-card-text>
          <v-card-actions>
            <v-btn @click='solutionDialog = false'>Cancel</v-btn>
            <v-spacer />
            <v-btn :disabled='tmpSolution.options.length === 0' @click='curHunt.answers[editSolutionIdx] = tmpSolution; solutionDialog = false; saveAnswers({answers: curHunt.answers, id: curHunt.id})'>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-flex>
    <clue-table :cur-hunt='curHunt' />

    <v-flex xs12>
      <v-card class='mt-3 mb-3'>
        <v-card-title primary-title>
          <p class='headline'>Map Pieces</p>
        </v-card-title>
        <v-data-table :items='curHunt.mapPieces' class='elevation-1'
          :headers='[{ text: "Title", value: "title" }, { text: "Associated Clues", value: "clueList" }]'
          :rows-per-page-items='[10, 20,{"text": "$vuetify.dataIterator.rowsPerPageAll","value": -1}]'>
        <template slot='items' slot-scope='{ item }'>
          <td width='10%'>{{ item.title }}</td>
          <td><v-select :items='curHunt.clues' attach chips multiple
                @input='updateMapPiece(item)'
                label='Revealed when selected clues are Scanned' v-model='item.clues'
                item-text='title' item-value='id' dense deletable-chips hide-selected small-chips /></td>
        </template>
        </v-data-table>
      </v-card>
    </v-flex>

    <v-dialog v-model='editHunt' persistent max-width='500'>
      <v-card>
        <v-card-title class='headline pb-1'>Edit Hunt Info</v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field label='Title' v-model='newTitle'
            single-line counter maxlength='50' :rules='[v => !!v || "Cannot be empty"]' />
          <v-textarea label='Description' v-model='newDesc' />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn flat @click='editHunt = false'>
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn flat @click='saveHuntInfo()' :disabled='newTitle.length === 0'>
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Hunt, MapPiece, Solution } from '@/api/hunt';
import { State, Action } from 'vuex-class';
import ClueTable from '@/components/admin/ClueTable.vue';

@Component({
  components: {
    ClueTable,
  },
})
export default class ScavengerHome extends Vue {
  @Prop(Number) public id!: number;
  @State((state) => state.admin.scavenger.hunts) public hunts!: Hunt[];
  @Action('admin/scavenger/updateHunt') public updateHunt!: (h: Hunt) => Promise<void>;
  @Action('admin/scavenger/updateMapPieceClues') public updateMapPiece!: (m: MapPiece) => Promise<void>;
  @Action('admin/scavenger/updateAnswers') public saveAnswers!: (payload: {answers: Solution[], id: number}) => Promise<void>;

  public newTitle = '';
  public newDesc = '';
  public editHunt = false;
  public zoomimg = false;
  public solutionNav = 'settings';
  public solutionDialog = false;
  public editSolutionIdx = 0;
  public editorIdx = -1;
  public tmpSolution: Solution = { huntId: this.id,  title: '', solution: -1, options: []};

  public get curHunt(): Hunt {
    return this.hunts.find((h) => this.id === h.id) || new Hunt();
  }

  public huntEdit() {
    this.newTitle = this.curHunt.title;
    this.newDesc = this.curHunt.desc;
    this.editHunt = true;
  }

  public saveHuntInfo() {
    this.curHunt.title = this.newTitle;
    this.curHunt.desc = this.newDesc;
    this.updateHunt(this.curHunt);
    this.newTitle = this.newDesc = '';
    this.editHunt = false;
  }

  public editSolution(i: number) {
    this.editSolutionIdx = i;
    this.tmpSolution = JSON.parse(JSON.stringify(this.curHunt.answers[i]));
    this.solutionDialog = true;
  }

  public removeOpt(opt: string) {
    const idx = this.tmpSolution.options.findIndex((s) => s === opt);
    this.tmpSolution.options.splice(idx, 1);
  }

  public saveOpt() {
    this.editorIdx = -1;
  }
}
</script>

<style lang="stylus" scoped>
.zoomimg
  width 90%
  cursor zoom-in

ul#map
  width 1500px
  background-size contain
  list-style none
  margin 0
  padding 0
  position relative

  li
    position absolute

.none
  background-image url('/img/none.svg')

</style>

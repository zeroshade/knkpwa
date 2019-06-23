<template>
  <v-layout wrap>
    <v-flex xs10>
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
          <img class='zoomimg' @click='zoomimg = true' src='@/assets/star_map_complete.png' />
          <v-dialog v-model='zoomimg' transition='scale-transition' lazy width='75%'>
            <div v-dragscroll style='width: 100%; overflow: hidden; cursor: grab'>
              <img src='@/assets/star_map_complete.png' width='1500px'/>
            </div>
          </v-dialog>
        </v-card-text>
      </v-card>
    </v-flex>

    <v-flex xs12>
      <v-card>
        <v-card-title>
          <p class='headline'>Clues</p>
          <v-spacer />
          <v-text-field append-icon='search' label='Search'
            single-line hide-details v-model='search' />
        </v-card-title>
        <v-data-table :headers='headers'
          :items='curHunt.clues'
          :search='search'
          class='elevation-1'
          :rows-per-page-items='[10,20,{"text": "$vuetify.dataIterator.rowsPerPageAll", "value": -1}]'>
          <template slot='items' slot-scope='{ item }'>
            <td class='pb-2 pt-2' width='100'>
              <qr-code-component style='cursor: pointer'
                :key='item.key()'
                :color='item.color' :bg-color='item.bgColor'
                :text='item.id' :size='50' @click.native='colorEdit(item)' />
            </td>
            <td width='10%'>
              <p style='cursor: pointer' @click='textEdit(item)'>{{ item.title }}</p>
            </td>
            <td>
              <p style='cursor: pointer' @click='textEdit(item)'>{{ item.text }}</p>
            </td>
            <td>
              <p style='cursor: pointer' @click='textEdit(item)'>{{ item.mapPiece ? item.mapPiece.title : '' }}</p>
            </td>
            <td class='justify-center px-0' width='10%'>
              <v-btn small icon @click='clueEdit = item; confirmDialog = true;'>
                <v-icon small>delete</v-icon>
              </v-btn>
            </td>
          </template>
          <template slot='footer'>
            <td align='right' :colspan='headers.length'>
              <v-btn @click.native='clueDialog = true'>New Clue</v-btn>
            </td>
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
    <v-dialog v-model='confirmDialog' persistent max-width='300'>
      <v-card>
        <v-card-title class='headline pb-1'>Confirm Delete</v-card-title>
        <v-divider />
        <v-card-text v-if='clueEdit !== null'>
          Are you sure you want to delete?
          <br /><br />
          <em><strong>This cannot be undone</strong></em>
        </v-card-text>
        <v-divider />
        <v-card-actions v-if='clueEdit !== null'>
          <v-btn flat @click='deleteClue(clueEdit); clueEdit = null; confirmDialog = false;'>
            Yes
          </v-btn>
          <v-spacer />
          <v-btn flat @click='clueEdit = null; confirmDialog = false;'>
            No
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model='qrEdit' persistent max-width='500'>
      <v-card>
        <v-card-title class='headline pb-1'>Edit QR Code</v-card-title>
        <v-divider />
        <v-card-text>
          <div style='margin: 0 auto; width: 270px; height: 270px;'>
            <qr-code-component v-if='clueEdit !== null' :text='clueEdit.id'
              :key='clueEdit.key()'
              :size='250' :color='clueEdit.color' :bg-color='clueEdit.bgColor' />
          </div>
          <color-menu v-if='clueEdit !== null' v-model='clueEdit.color' label='color' />
          <color-menu v-if='clueEdit !== null' v-model='clueEdit.bgColor' label='bgcolor' />
        </v-card-text>
        <v-card-actions>
          <v-btn flat @click='qrEdit = false'>
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn flat @click='updateClue(clueEdit); qrEdit = false'>
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model='clueDialog' persistent max-width='500'>
      <v-card>
        <v-card-title class='headline pb-1'>{{ clueEdit === null ? 'New' : 'Edit' }} Clue</v-card-title>
        <v-divider />
        <v-card-text>
          <v-layout>
            <v-flex xs7>
              <v-text-field v-if='clueEdit === null' label='Clue Title' v-model='newTitle'
                :rules='[v => !!v || "Cannot be empty"]' />
              <v-text-field v-else label='Clue Title' v-model='clueEdit.title'
                :rules='[v => !!v || "Cannot be empty"]' />
            </v-flex>
            <v-flex offset-xs1 xs4>
              <v-select v-if='clueEdit === null' clearable v-model='newMapReveal'
                :items='availPieces' item-text='title'
                item-value='id' label='Reveals Map Area'
                persistent-hint hint="Leave blank if doesn't reveal" />
              <v-select v-else clearable v-model='clueEdit.mapId'
                :items='availPieces' item-text='title'
                item-value='id' label='Reveals Map Area'
                persistent-hint hint="Leave blank if doesn't reveal" />
            </v-flex>
          </v-layout>
          <v-textarea v-if='clueEdit === null' label='Clue Text' v-model='newText'
            :rules='[v => !!v || "Cannot be empty"]' />
          <v-textarea v-else label='Clue Text' v-model='clueEdit.text'
            :rules='[v => !!v || "Cannot be empty"]' />
        </v-card-text>
        <v-divider/>
        <v-card-actions>
          <v-spacer />
          <v-btn flat @click='clueDialog = false; clueEdit = null; newText = ""; newMapReveal = undefined'>
            Close
          </v-btn>
          <v-btn v-if='clueEdit === null' :disabled='newText.length === 0' flat @click='newClue'>
            Create
          </v-btn>
          <v-btn v-else :disabled='clueEdit.text.length === 0' flat @click='saveClue'>
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import QrCodeComponent from 'vue-qrcode-component';
import { Hunt, Clue, MapPiece } from '@/api/hunt';
import { State, Action } from 'vuex-class';
import { Chrome } from 'vue-color';
import ColorMenu from '@/components/admin/ColorMenu.vue';

@Component({
  components: {
    QrCodeComponent,
    'chrome-picker': Chrome,
    ColorMenu,
  },
})
export default class ScavengerHome extends Vue {
  @Prop(Number) public id!: number;
  @State((state) => state.admin.scavenger.hunts) public hunts!: Hunt[];
  @State((state) => state.admin.scavenger.mapPieces) public pieces!: MapPiece[];
  @Action('admin/scavenger/addClue') public addClue!: (c: Clue) => Promise<void>;
  @Action('admin/scavenger/updateClue') public updateClue!: (c: Clue) => Promise<void>;
  @Action('admin/scavenger/deleteClue') public deleteClue!: (c: Clue) => Promise<void>;
  @Action('admin/scavenger/updateHunt') public updateHunt!: (h: Hunt) => Promise<void>;

  public newTitle = '';
  public newDesc = '';
  public newText = '';
  public newMapReveal: null | number = null;
  public clueDialog = false;
  public confirmDialog = false;
  public qrEdit = false;
  public editHunt = false;
  public search = '';
  public clueEdit: Clue | null = null;
  public zoomimg = false;
  public color = '';
  public headers = [
    { text: 'QR', align: 'left', sortable: false },
    { text: 'Title', align: 'left', sortable: true, value: 'title' },
    { text: 'Text', sortable: true, value: 'text' },
    { text: 'Reveals', sortable: true, value: 'mapPiece.title' },
    { text: '', sortable: false },
  ];

  public get availPieces(): MapPiece[] {
    return this.pieces.filter((p) => (this.clueEdit && this.clueEdit.mapId === p.id) ||
      this.newMapReveal === p.id ||
      this.curHunt.clues.findIndex((c) => p.id === c.mapId) === -1);
  }

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

  public colorEdit(c: Clue) {
    this.clueEdit = c.clone();
    this.qrEdit = true;
  }

  public textEdit(c: Clue) {
    this.clueEdit = c.clone();
    this.clueDialog = true;
  }

  public newClue() {
    this.addClue(new Clue(this.newTitle, this.newText, this.curHunt.id, undefined, this.pieces.find((p) => p.id === this.newMapReveal)));
    this.newTitle = '';
    this.newText = '';
    this.clueDialog = false;
  }

  public saveClue() {
    if (this.clueEdit === null) { return; }

    if (this.clueEdit.mapId) {
      this.clueEdit.mapPiece = this.pieces.find((p) => this.clueEdit && p.id === this.clueEdit.mapId);
    } else {
      this.clueEdit.mapPiece = undefined;
    }
    this.updateClue(this.clueEdit);
    this.clueDialog = false;
    this.qrEdit = false;
    this.clueEdit = null;
  }
}
</script>

<style lang="stylus" scoped>
.zoomimg
  width 90%
  cursor zoom-in
</style>

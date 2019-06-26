<template>
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
  </v-flex>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import QrCodeComponent from 'vue-qrcode-component';
import { Hunt, Clue } from '@/api/hunt';
import { Action } from 'vuex-class';
import { Chrome } from 'vue-color';
import ColorMenu from '@/components/admin/ColorMenu.vue';

@Component({
  components: {
    QrCodeComponent,
    'chrome-picker': Chrome,
    ColorMenu,
  },
})
export default class ClueTable extends Vue {
  @Prop(Object) public curHunt!: Hunt;
  @Action('admin/scavenger/addClue') public addClue!: (c: Clue) => Promise<void>;
  @Action('admin/scavenger/updateClue') public updateClue!: (c: Clue) => Promise<void>;
  @Action('admin/scavenger/deleteClue') public deleteClue!: (c: Clue) => Promise<void>;

  public qrEdit = false;
  public clueDialog = false;
  public confirmDialog = false;
  public clueEdit: Clue | null = null;
  public newTitle = '';
  public newText = '';
  public search = '';
  public headers = [
    { text: 'QR', align: 'left', sortable: false },
    { text: 'Title', align: 'left', sortable: true, value: 'title' },
    { text: 'Text', sortable: true, value: 'text' },
    { text: '', sortable: false },
  ];

  public textEdit(c: Clue) {
    this.clueEdit = c.clone();
    this.clueDialog = true;
  }

  public colorEdit(c: Clue) {
    this.clueEdit = c.clone();
    this.qrEdit = true;
  }

  public newClue() {
    this.addClue(new Clue(this.newTitle, this.newText, this.curHunt.id, undefined));
    this.newTitle = '';
    this.newText = '';
    this.clueDialog = false;
  }

  public saveClue() {
    if (this.clueEdit === null) { return; }

    this.updateClue(this.clueEdit);
    this.clueDialog = false;
    this.qrEdit = false;
    this.clueEdit = null;
  }
}
</script>
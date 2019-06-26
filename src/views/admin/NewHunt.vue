<template>
  <v-layout wrap>
    <v-flex xs10>
      <v-card class='mb-3'>
        <v-card-title primary-title class='display-1'>Hunt List</v-card-title>
        <v-data-table
          :headers='headers'
          :items='hunts'
          class='elevation-1'
          :rows-per-page-items='[10,20,{"text": "$vuetify.dataIterator.rowsPerPageAll", "value": -1}]'>
          <template slot='items' slot-scope='{ item }'>
            <td width='30%'>{{ item.title }}</td>
            <td>{{ item.desc }}</td>
            <td>{{ item.clues.length }}</td>
            <td class='justify-center px-0' width='10%'>
              <v-btn small icon @click='confirm(item)'>
                <v-icon small>delete</v-icon>
              </v-btn>
            </td>
          </template>
          <template slot='footer'>
            <td align='right' :colspan='headers.length'>
              <v-btn @click.native='newHunt = true'>New Hunt</v-btn>
            </td>
          </template>
        </v-data-table>
      </v-card>
    </v-flex>
    <v-dialog lazy v-model='newHunt' persistent max-width='500'>
      <v-card>
        <v-card-title class='headline pb-1'>Create New Hunt</v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field label='Title' single-line counter maxlength='50' v-model='newTitle'
            :rules='[v => !!v || "Cannot be empty"]'/>
          <v-textarea label='Description' v-model='newDesc' />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn flat @click='newHunt = false'>
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn flat @click='createNewHunt()' :disabled='newTitle.length === 0'>
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog lazy v-model='confirmDelete' persistent max-width='500'>
      <v-card>
        <v-card-title class='headline pb-1'>Confirm Delete</v-card-title>
        <v-divider />
        <v-card-text v-if='selected !== null'>
          Are you sure you want to delete the hunt:<br />
          <strong>{{ selected.title }}</strong>?
          <br /><br />
          <strong><em>This cannot be Undone and will delete all associated clues</em></strong>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn flat @click='removeHunt()'>
            Yes
          </v-btn>
          <v-spacer />
          <v-btn flat @click='confirmDelete = false'>
            No
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Hunt } from '@/api/hunt';
import { State, Action } from 'vuex-class';

@Component
export default class NewScavenger extends Vue {
  @State((state) => state.admin.scavenger.hunts) public hunts!: Hunt[];
  @Action('admin/scavenger/updateHunt') public saveHunt!: (h: Hunt) => Promise<void>;
  @Action('admin/scavenger/loadHunts') public loadHunts!: () => Promise<void>;
  @Action('admin/scavenger/removeHunt') public deleteHunt!: (h: Hunt) => Promise<void>;

  public confirmDelete = false;
  public newHunt = false;
  public newTitle = '';
  public newDesc = '';
  public selected: Hunt | null = null;
  public headers = [
    { text: 'Title', sortable: true, value: 'title' },
    { text: 'Description', sortable: false },
    { text: 'Num Clues', sortable: false },
    { text: '', sortable: false },
  ];

  public confirm(h: Hunt) {
    this.selected = h;
    this.confirmDelete = true;
  }

  public async removeHunt() {
    if (this.selected === null) { return; }
    await this.deleteHunt(this.selected);
    this.confirmDelete = false;
    this.selected = null;
  }

  public async createNewHunt() {
    await this.saveHunt(new Hunt({id: -1, title: this.newTitle, desc: this.newDesc, clues: [], type: '', mapPieces: [], answers: []}));
    this.newHunt = false;
    await this.loadHunts();
    this.newTitle = '';
    this.newDesc = '';
  }
}
</script>
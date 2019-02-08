<template>
  <v-app dark id='schedule'>
    <nav-bar v-model='drawer' />
    <toolbar v-model='drawer' />
    <v-content fill-height class="amber darken-4">
      <router-view />
      <event-dialog :width='500' />
    </v-content>
    <v-footer app>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import Toolbar from '@/components/Toolbar.vue';
import NavBar from '@/components/NavBar.vue';
import EventDialog from '@/components/EventDialog.vue';

@Component({
  components: {
    NavBar,
    Toolbar,
    EventDialog,
  },
})
export default class Layout extends Vue {
  @Action('fetchScheds') public fetchScheds!: () => Promise<void>;
  @Getter('auth/admin') public isAdmin!: boolean;

  public drawer = null;

  public mounted() {
    this.fetchScheds();
  }
}
</script>

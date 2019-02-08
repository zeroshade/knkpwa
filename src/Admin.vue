<template>
  <v-app dark id='admin'>
    <nav-drawer v-model='drawer' />
    <toolbar v-model='drawer' />
    <v-content fill-height>
      <router-view />
    </v-content>
    <v-footer app>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import NavDrawer from '@/components/admin/NavDrawer.vue';
import Toolbar from '@/components/admin/Toolbar.vue';

@Component({
  components: {
    NavDrawer,
    Toolbar,
  },
})
export default class Admin extends Vue {
  @Action('fetchScheds') public fetchScheds!: () => Promise<void>;
  @Getter('auth/admin') public isAdmin!: boolean;

  public drawer = null;

  public mounted() {
    if (!this.isAdmin) {
      window.location.href = process.env.BASE_URL;
      return;
    }
    this.fetchScheds();
  }
}
</script>

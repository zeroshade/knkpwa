<template>
  <v-app dark id='schedule'>
    <router-view name='navbar' v-model='drawer' />
    <router-view name='toolbar' v-model='drawer' />
    <v-content :class='$route.path.match(/\/admin/) === null ? "amber darken-4" : ""'>
      <router-view />
      <event-dialog :width='500' />
    </v-content>
    <v-footer app>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script lang='ts'>
import { Component, Watch, Vue } from 'vue-property-decorator';
import EventDialog from '@/components/EventDialog.vue';
import { Getter, State, Action } from 'vuex-class';
import { Route } from 'vue-router';


@Component({
  components: {
    EventDialog,
  },
})
export default class Layout extends Vue {
  @Action('fetchScheds') public fetchScheds!: () => Promise<void>;
  @State('auth/accessToken') public accessToken!: string;
  @Getter('auth/admin') public isAdmin!: boolean;

  public drawer = null;

  public mounted() {
    this.fetchScheds();
  }

  @Watch('$route')
  public onRouteChange(to: Route, from: Route) {
    this.drawer = null;
    if (to.path.match(/\/admin/) !== null && !this.isAdmin) {
      this.$router.push({name: 'home'});
    }
  }

  public async testnotif() {
    const resp = await fetch('http://localhost:8090/notify', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'google-oauth2|103308077674968453413',
        message: 'Super Test Notification!',
      }),
    });
  }

  public async testreq() {
    const resp = await fetch('http://localhost:8090/test', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    console.log(await resp.json());
  }
}
</script>

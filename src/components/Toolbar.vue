<template>
  <v-toolbar dense tabs :color='color' app>
    <v-toolbar-side-icon aria-label='menu' @click.stop='$emit("input", !value)'>
      <v-icon>menu</v-icon>
    </v-toolbar-side-icon>
    <v-toolbar-title>Kith &amp; Kink Schedule -- {{ curSchedule ? curSchedule.title : '' }}</v-toolbar-title>
    <v-spacer />
    <v-btn round :color='btncolor' v-if='!authenticated' @click='login()'>Login / Sign Up</v-btn>
    <template v-else>
      <v-menu :nudge-width='200' offset-overflow left v-model='menu' :close-on-content-click='false'>
        <v-avatar slot='activator' class='mt-1' :tile='false' size='38' color='grey lighten-4'>
          <v-img :src='avatar' alt='avatar' />
        </v-avatar>
        <v-card>
          <v-list>
            <v-list-tile avatar>
              <v-list-tile-avatar>
                <img :src='avatar' alt='avatar' />
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{ nickname }}</v-list-tile-title>
                <v-list-tile-sub-title>{{ username }}</v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <v-tooltip bottom>
                  <v-btn @click='logout()' slot='activator' class='red--text' icon><v-icon>exit_to_app</v-icon></v-btn>
                  <span>Logout</span>
                </v-tooltip>
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
          <v-divider />
          <v-list>
            <v-list-tile>
              <v-list-tile-action>
                <v-switch v-model='notifsEnabled'></v-switch>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Enable Notifications</v-list-tile-title>
                <v-list-tile-sub-title>Per Device Setting</v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-list-tile href='/admin/' v-if='isAdmin'>
              <v-list-tile-content>
                <v-list-tile-title>Go To Admin Panel</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-menu>
    </template>
    <v-tabs slot='extension' centered grow :color='color' :slider-color='slider'>
      <v-tab :to='{ name: "agenda", params: $route.params }'>Agenda</v-tab>
      <v-tab :to='{ name: "rooms", params: $route.params }'>Room View</v-tab>
      <v-tab :to='{ name: "events", params: $route.params }'>Event View</v-tab>
    </v-tabs>
  </v-toolbar>
</template>

<script lang='ts'>
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import { Schedule } from '@/api/schedule';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

@Component
export default class Toolbar extends Vue {
  @Prop(Boolean) public value!: boolean;
  @Action('auth/login') public login!: () => void;
  @Action('auth/logout') public logout!: () => void;
  @Action('auth/renewAuth') public renewAuth!: () => void;
  @Action('auth/unsubscribe') public unsubscribe!: (sub: PushSubscription) => void;
  @Action('auth/updateSubscription') public updateSubscription!: (sub: PushSubscription) => void;
  @Getter('auth/authenticated') public authenticated!: boolean;
  @Getter('auth/authflag') public authflag!: boolean;
  @Getter('auth/avatar') public avatar!: string;
  @Getter('auth/username') public username!: string;
  @Getter('auth/nickname') public nickname!: string;
  @Getter('auth/admin') public isAdmin!: boolean;
  @Getter('curSchedule') public curSchedule!: Schedule;

  public readonly color = process.env.VUE_APP_TOOLBAR_COLOR;
  public readonly btncolor = process.env.VUE_APP_LOGIN_COLOR;
  public readonly slider = process.env.VUE_APP_SLIDER_COLOR;

  public menu = false;
  public notifPermission = false;
  public notifsEnabled = false;
  public swReg: ServiceWorkerRegistration | null = null;

  public created() {
    if (this.authflag) {
      this.renewAuth();
    }

    this.notifPermission = (Notification.permission === 'granted');
  }

  public async mounted() {
    if (!navigator.serviceWorker) { return; }

    this.swReg = await navigator.serviceWorker.getRegistration() || null;
    if (!this.swReg) { return; }

    const sub = await this.swReg.pushManager.getSubscription();
    this.notifsEnabled = (sub !== null);
  }

  @Watch('notifsEnabled')
  public async toggleNotifications(val: boolean, oldVal: boolean) {
    if (val && !this.notifPermission) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.notifPermission = true;
      }
    }

    if (!this.swReg) { return; }
    let sub = await this.swReg.pushManager.getSubscription();

    if (!oldVal && val) {
      if (!sub) {
        const applicationServerKey = urlB64ToUint8Array(process.env.VUE_APP_VAPID_PUBLIC_KEY);
        sub = await this.swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        await this.updateSubscription(sub);
      }
    } else if (oldVal && !val) {
      if (sub) {
        await this.unsubscribe(sub);
        sub.unsubscribe();
      }
    }
  }
}
</script>

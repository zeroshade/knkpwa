<template>
  <div>
    Authenticating...
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Action } from 'vuex-class';

@Component
export default class Auth extends Vue {
  @Action('auth/handleAuthentication') public handleAuth!: () => void;

  public mounted() {
    this.handleAuth();
    this.$router.push({ name: 'home' });
  }
}
</script>

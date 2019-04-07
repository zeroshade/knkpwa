<template>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';

@Component
export default class Landing extends Vue {
  @Getter('auth/authflag') public authflag!: boolean;
  @Getter('auth/defview') public defView!: string;
  @Action('auth/renewAuth') public renewAuth!: () => Promise<void>;

  public async created() {

  }
}
</script>
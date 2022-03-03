<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" fixed clipped app>
      <v-list>
        <v-list-item v-for="item in items" :key="item.text" link>
          <v-list-item-content>
            <nuxt-link :to="`${item.link}`">
              {{ item.text }}
            </nuxt-link>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar color="white" dense fixed clipped-left app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title class="mr-5 align-center">
        <span class="title">sumomine</span>
      </v-toolbar-title>
    </v-app-bar>
    <v-main>
      <Nuxt />
    </v-main>
  </v-app>
</template>

<style scoped>
</style>

<script>
export default {
  data() {
    return {
      drawer: true,
      items: [
        { text: "live", link: "/" },
        { text: "news", link: "/news" },
        { text: "番付 banzuke", link: "/banzuke" },
        { text: "取組 torikumi", link: "/torikumi" },
        { text: "決まり手 kimarite", link: "/kimarite" },
        { text: "り手 techniques", link: "/techniques" },
        { text: "力士 rikishi", link: "/rikishi" },
        { text: "ranks", link: "/ranks" },
        { text: "年寄株 kabu", link: "/kabu" },
        { text: "部屋 heya", link: "/heya" },
        { text: "links", link: "/links" },
      ],
    };
  },
};
</script>
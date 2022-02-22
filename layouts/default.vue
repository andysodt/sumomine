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
      <v-spacer />
      <v-layout row align-center style="max-width: 650px">
        <v-text-field
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="white"
          hide-details
        />
      </v-layout>
    </v-app-bar>
    <v-content>
      <Nuxt />
    </v-content>
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
        { text: 'news', link: '/' },
        { text: '決まり手 kimarite', link: '/kimarite' },
        { text: '力士 rikishi', link: '/rikishi' }
      ]
    }
  }
}
</script>
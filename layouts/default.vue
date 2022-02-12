<template>
  <v-app dark>
    <v-navigation-drawer v-model="drawer" clipped app>
      <v-list>
        <v-list-item v-for="item in items" :key="item.text" link>
          <v-list-item-content>
            <v-list-item-title>
              {{ item.text }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar color="white" dense app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title class="mr-1 align-center">
        <span class="title">Sumomine</span>
      </v-toolbar-title>
      <v-spacer />
      <v-layout row align-center>
        <v-text-field
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="black"
        />
      </v-layout>
    </v-app-bar>
    <v-main>
      <Nuxt/>
    </v-main>
  </v-app>
</template>

<style scoped>
</style>

<script>
export default {
  head: {
    title: 'Sumomine'
  },
  data () {
    return {
      drawer: true,
      items: [
        { text: 'News', link: 'kimarite'  },
        { text: 'Banzuke', link: 'kimarite'  },
        { text: 'Kimarite', link: 'kimarite' },
        { text: 'Rikishi', link: 'rikishi'  }
      ]
    }
  }
}
</script>
<template>
  <v-app dark>
    <v-app-bar color="white" dense app>
      <v-toolbar-title class="mr-1 align-center">
        <nuxt-link class="title" :to="`/`">Sumomine</nuxt-link>
      </v-toolbar-title>
      <v-spacer />
      <v-layout row align-center>
        <nuxt-link  :to="`/news`">Live</nuxt-link>
        <v-spacer />
        <nuxt-link  :to="`/basho`">Basho</nuxt-link>
        <v-spacer />
        <nuxt-link  :to="`/banzuke`">Banzuke</nuxt-link>
        <v-spacer />
        <nuxt-link :to="`/kimarite`">Kimarite</nuxt-link>
        <v-spacer />
        <nuxt-link :to="`/rikishi`">Rikishi</nuxt-link>
        <v-spacer />
        <nuxt-link :to="`/query`">Query</nuxt-link>
        <v-spacer />        
        <nuxt-link :to="`/about`">About</nuxt-link>
        <v-spacer />
        <v-text-field
          align-center
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          color="black"
        />
      </v-layout>
    </v-app-bar>
    <v-main>
      <Nuxt />
    </v-main>
  </v-app>
</template>
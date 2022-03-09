<template>
  <v-card>
    <div v-for="item in banzuke" :key="item.id">
      <v-card-title>
        {{ item.name }}
      </v-card-title>
      <v-card-text>
        {{ item.location }}
      </v-card-text>
      <v-card-text>
        <NuxtLink to="/banzuke"> List of banzuke </NuxtLink>
      </v-card-text>
    </div>
  </v-card>
</template>

<script>
import banzuke from "~/apollo/queries/fetchBanzukeById";

export default {
  apollo: {
    banzuke: {
      query: banzuke,
      prefetch: ({ route }) => ({ id: route.params.id }),
      variables() {
        return { id: this.$route.params.id };
      },
    },
  },
};
</script>


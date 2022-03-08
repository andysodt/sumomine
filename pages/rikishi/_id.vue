<template>
  <v-card>
    <div v-for="item in rikishi" :key="item.id">
      <v-card-title>
        {{ item.shikona }}
      </v-card-title>
      <v-card-text>
        {{ item.heya }}
      </v-card-text>
      <v-card-text>
        <NuxtLink to="/rikishi"> List of rikishi </NuxtLink>
      </v-card-text>
      </div>
  </v-card>
</template>

<script>
import rikishi from "~/apollo/queries/fetchRikishiByType";

export default {
  apollo: {
    rikishi: {
      query: rikishi,
      prefetch: ({ route }) => ({ id: route.params.id }),
      variables() {
        return { id: this.$route.params.id };
      },
    },
  },
  head() {
    return {
      title: "Rikishi",
    };
  },
};
</script>


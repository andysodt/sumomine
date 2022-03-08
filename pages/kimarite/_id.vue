<template>
  <v-card>
    <div v-for="item in kimarite" :key="item.id">
      <v-card-title> {{ item.name }} {{ item.name_eng }} </v-card-title>
      <v-card-text>
        {{ item.description_eng }}
      </v-card-text>
      <v-card-text>
        {{ item.details_eng }}
      </v-card-text>
      <v-card-text>
        <NuxtLink to="/kimarite"> List of kimarite </NuxtLink>
      </v-card-text>
    </div>
  </v-card>
</template>

<script>
import kimarite_by_type from "~/apollo/queries/fetchKimariteByType";

export default {
  apollo: {
    kimarite: {
      query: kimarite_by_type,
      prefetch: ({ route }) => ({ id: route.params.id }),
      variables() {
        return { id: this.$route.params.id };
      },
    },
  },
  head() {
    return {
      title: "Kimarite by Type",
    };
  },
};
</script>


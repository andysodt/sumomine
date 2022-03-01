<template>
  <v-card>
    <v-card-title>
      news
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="news"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    >
    </v-data-table>
  </v-card>
</template>

<script>
import news from "~/apollo/queries/fetchNews";

export default {
  data() {
    return {
      search: '',
      headers: [
        {
          text: "Title",
          align: "start",
          sortable: true,
          value: "title",
        },
        {
          text: "Content",
          align: "start",
          sortable: true,
          value: "content",
        },
      ],
      news: [],
    };
  },
  apollo: {
    news: {
      prefetch: true,
      query: news,
    },
  },
};
</script>
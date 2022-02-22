<template>
  <v-data-table
    :headers="headers"
    :items="news"
    :items-per-page="15"
    class="elevation-1"
  ></v-data-table>
</template>

<script>
import news from "~/apollo/queries/fetchNews";

export default {
  data() {
    return {
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
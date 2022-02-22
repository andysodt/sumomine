<template>
  <v-data-table
    :headers="headers"
    :items="rikishi"
    :items-per-page="15"
    class="elevation-1"
  ></v-data-table>
</template>

<script>
import rikishi from "~/apollo/queries/fetchRikishi";

export default {
  data() {
    return {
      headers: [
        {
          text: "四股名",
          align: "start",
          sortable: true,
          value: "shikona",
        },
        {
          text: "Shikona",
          align: "start",
          sortable: true,
          value: "shikona",
        },
        {
          text: "Heya",
          align: "start",
          sortable: true,
          value: "heya",
        },
      ],
      rikishi: [],
    };
  },
  apollo: {
    rikishi: {
      prefetch: true,
      query: rikishi,
    },
  },
};
</script>
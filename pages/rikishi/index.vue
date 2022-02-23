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
          text: "Heya",
          align: "start",
          sortable: true,
          value: "heya",
        },
        {
          text: "Shusshin",
          align: "start",
          sortable: true,
          value: "shusshin",
        },
        {
          text: "Birth Date",
          align: "start",
          sortable: true,
          value: "birth_date",
        },		
        {
          text: "Highest Rank",
          align: "start",
          sortable: true,
          value: "highest_rank",
        },		
        {
          text: "Intai",
          align: "start",
          sortable: true,
          value: "intai",
        },		
        {
          text: "Hatsu Dohyo",
          align: "start",
          sortable: true,
          value: "hatsu_dohyo",
        },		
        {
          text: "Last Shikona",
          align: "start",
          sortable: true,
          value: "last_shikona",
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
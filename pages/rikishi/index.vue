<template>
  <v-data-table
    :headers="headers"
    :items="rikishi"
    :items-per-page="500"
    class="elevation-1"
  >

    <template #item.image="{ item }">
      <img :height="100" :src="item.image">
    </template>

  </v-data-table>

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
        {
          text: "Image",
          align: "start",
          sortable: true,
          value: "image",
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
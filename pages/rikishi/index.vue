<template>
  <v-card>
    <v-card-title>
      力士 rikishi
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
      :items="rikishi"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    >
      <template #item.image="{ item }">
        <img :height="100" :src="item.image" />
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import rikishi from "~/apollo/queries/fetchRikishi";

export default {
  data() {
    return {
      search: "",
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
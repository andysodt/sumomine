<template>
  <v-card>
    <v-card-title>
      Ranks
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
      :items="ranks"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    ></v-data-table>
  </v-card>
</template>

<script>
import ranks from "~/apollo/queries/fetchRanks";

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
          text: "Title",
          align: "start",
          sortable: true,
          value: "title_eng",
        },
        {
          text: "Code",
          align: "start",
          sortable: true,
          value: "code",
        },      ],
      ranks: [],
    };
  },
  apollo: {
    ranks: {
      prefetch: true,
      query: ranks,
    },
  },
};
</script>
<template>
  <v-card>
    <v-card-title>
      番付 banzuke
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
      :items="banzuke"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    ></v-data-table>
  </v-card>
</template>

<script>
import banzuke from "~/apollo/queries/fetchBanzuke";

export default {
  data() {
    return {
      search: "",
      headers: [
        {
          text: "番付",
          align: "start",
          sortable: true,
          value: "name",
        },
        {
          text: "Banzuke",
          align: "start",
          sortable: true,
          value: "name_eng",
        },
        {
          text: "Start",
          align: "start",
          sortable: true,
          value: "start_date",
        },
        {
          text: "End",
          align: "start",
          sortable: true,
          value: "end_date",
        },
        {
          text: "Location",
          align: "start",
          sortable: true,
          value: "location",
        },
      ],
      banzuke: [],
    };
  },
  apollo: {
    banzuke: {
      prefetch: true,
      query: banzuke,
    },
  },
};
</script>
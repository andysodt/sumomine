<template>
  <v-card>
    <v-card-title>
      取組 torikumi
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
      :items="torikumi"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    ></v-data-table>
  </v-card>
</template>

<script>
import torikumi from "~/apollo/queries/fetchTorikumi";

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
      torikumi: [],
    };
  },
  apollo: {
    torikumi: {
      prefetch: true,
      query: torikumi,
    },
  },
};
</script>
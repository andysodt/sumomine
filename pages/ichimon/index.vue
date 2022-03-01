<template>
  <v-card>
    <v-card-title>
      一門 ichimon
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
      :items="ichimon"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    ></v-data-table>
  </v-card>
</template>

<script>
import ichimon from "~/apollo/queries/fetchIchimon";

export default {
  data() {
    return {
      search: '',
      headers: [
        {
          text: "一門",
          align: "start",
          sortable: true,
          value: "name",
        },
        {
          text: "Name",
          align: "start",
          sortable: true,
          value: "name_eng",
        },
      ],
      ichimon: [],
    };
  },
  apollo: {
    ichimon: {
      prefetch: true,
      query: ichimon,
    },
  },
};
</script>
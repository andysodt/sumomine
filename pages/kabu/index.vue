<template>
  <v-card>
    <v-card-title>
      年寄株 kabu
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
      :items="kabu"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    ></v-data-table>
  </v-card>
</template>

<script>
import kabu from "~/apollo/queries/fetchKabu";

export default {
  data() {
    return {
      search: "",
      headers: [
        {
          text: "年寄株",
          align: "start",
          sortable: true,
          value: "name",
        },
        {
          text: "Kabu",
          align: "start",
          sortable: true,
          value: "name_eng",
        },
      ],
      kabu: [],
    };
  },
  apollo: {
    kabu: {
      prefetch: true,
      query: kabu,
    },
  },
};
</script>
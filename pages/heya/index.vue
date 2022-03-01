<template>
  <v-card>
    <v-card-title>
      部屋 heya
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
      :items="heya_ichimon"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    >
      <template #item.heya.image="{ item }">
        <img :height="100" :src="item.heya.image" />
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import heya_ichimon from "~/apollo/queries/fetchHeya";

export default {
  data() {
    return {
      search: "",
      headers: [
        {
          text: "部屋",
          align: "start",
          sortable: true,
          value: "heya.name",
        },
        {
          text: "一門",
          align: "start",
          sortable: true,
          value: "ichimon.name",
        },
        {
          text: "Heya",
          align: "start",
          sortable: true,
          value: "heya.name_eng",
        },
        {
          text: "Ichimon",
          align: "start",
          sortable: true,
          value: "ichimon.name_eng",
        },
        {
          text: "Joined",
          align: "start",
          sortable: true,
          value: "date_joined",
        },
        {
          text: "Quit",
          align: "start",
          sortable: true,
          value: "date_quit",
        },
        {
          text: "Image",
          align: "start",
          sortable: true,
          value: "heya.image",
        },
      ],
      heya_ichimon: [],
    };
  },
  apollo: {
    heya_ichimon: {
      prefetch: true,
      query: heya_ichimon,
    },
  },
};
</script>
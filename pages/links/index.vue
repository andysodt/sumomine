<template>
  <v-card>
    <v-card-title>
      links
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
      :items="links"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    >
      <template #item.name="{ item }">
        <a target="_blank" :href="item.url">
          {{ item.name }}
        </a>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import links from "~/apollo/queries/fetchLinks";

export default {
  data() {
    return {
      search: "",
      headers: [
        {
          text: "Name",
          align: "start",
          sortable: true,
          value: "name",
        },
        {
          text: "Description",
          align: "start",
          sortable: true,
          value: "description",
        },
      ],
      links: [],
    };
  },
  apollo: {
    links: {
      prefetch: true,
      query: links,
    },
  },
};
</script>
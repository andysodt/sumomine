<template>
  <v-data-table
    :headers="headers"
    :items="links"
    :items-per-page="500"
    class="elevation-1"
  >
    <template #item.name="{ item }">
      <a target="_blank" :href="item.url">
        {{ item.name }}
      </a>
    </template>

  </v-data-table>
</template>

<script>
import links from "~/apollo/queries/fetchLinks";

export default {
  data() {
    return {
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
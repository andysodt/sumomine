<template>
  <v-data-table
    :headers="headers"
    :items="links"
    :items-per-page="500"
    class="elevation-1"
  ></v-data-table>
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
        {
          text: "Url",
          align: "start",
          sortable: true,
          value: "url",
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
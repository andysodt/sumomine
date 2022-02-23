<template>
  <v-data-table
    :headers="headers"
    :items="heya"
    :items-per-page="500"
    class="elevation-1"
  ></v-data-table>
</template>

<script>
import heya from "~/apollo/queries/fetchHeya";

export default {
  data() {
    return {
      headers: [
        {
          text: "Name",
          align: "start",
          sortable: true,
          value: "name_eng",
        },
      ],
      heya: [],
    };
  },
  apollo: {
    heya: {
      prefetch: true,
      query: heya,
    },
  },
};
</script>
<template>
  <v-data-table
    :headers="headers"
    :items="kabu"
    :items-per-page="500"
    class="elevation-1"
  ></v-data-table>
</template>

<script>
import kabu from "~/apollo/queries/fetchKabu";

export default {
  data() {
    return {
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
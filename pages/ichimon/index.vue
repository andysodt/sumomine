<template>
  <v-data-table
    :headers="headers"
    :items="ichimon"
    :items-per-page="500"
    class="elevation-1"
  ></v-data-table>
</template>

<script>
import ichimon from "~/apollo/queries/fetchIchimon";

export default {
  data() {
    return {
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
<template>
  <v-data-table
    :headers="headers"
    :items="heya_ichimon"
    :items-per-page="500"
    class="elevation-1"
  ></v-data-table>
</template>

<script>
import heya_ichimon from "~/apollo/queries/fetchHeya";

export default {
  data() {
    return {
      headers: [
        {
          text: "部屋",
          align: "start",
          sortable: true,
          value: "heya.name",
        },
        {
          text: "Heya",
          align: "start",
          sortable: true,
          value: "heya.name_eng",
        },
        {
          text: "一門",
          align: "start",
          sortable: true,
          value: "ichimon.name",
        },
        {
          text: "Ichimon",
          align: "start",
          sortable: true,
          value: "ichimon.name_eng",
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
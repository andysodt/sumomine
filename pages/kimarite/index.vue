<template>
  <v-data-table
    :headers="headers"
    :items="kimarite"
    :items-per-page="15"
    class="elevation-1"
  ></v-data-table>
</template>

<script>
import kimarite from "~/apollo/queries/fetchKimarite";

export default {
  data() {
    return {
      headers: [
        {
          text: "決まり手",
          align: "start",
          sortable: true,
          value: "name",
        },
        {
          text: "Deciding Technique",
          align: "start",
          sortable: true,
          value: "name_eng",
        },
        {
          text: "Description",
          align: "start",
          sortable: true,
          value: "description_eng",
        },
      ],
      kimarite: [],
    };
  },
  apollo: {
    kimarite: {
      prefetch: true,
      query: kimarite,
    },
  },
};
</script>
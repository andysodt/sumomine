<template>
  <v-data-table
    :headers="headers"
    :items="kimarite"
    :items-per-page="500"
    class="elevation-1"
  >
    <template #item.image="{ item }">
      <img :height="100" :src="item.image" />
    </template>

  </v-data-table>
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
          text: "Catagory",
          align: "start",
          sortable: true,
          value: "kimarite_type.name",
        },
        {
          text: "Catagory",
          align: "start",
          sortable: true,
          value: "kimarite_type.name_eng",
        },
        {
          text: "Description",
          align: "start",
          sortable: true,
          value: "description_eng",
        },
        {
          text: "Image",
          align: "start",
          sortable: true,
          value: "image",
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
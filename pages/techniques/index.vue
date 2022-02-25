<template>
  <v-data-table
    :headers="headers"
    :items="techniques"
    :items-per-page="500"
    class="elevation-1"
  >
    <template #item.image="{ item }">
      <img :height="100" :src="item.image" />
    </template>
  </v-data-table>
</template>

<script>
import techniques from "~/apollo/queries/fetchTechniques";

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
          text: "Technique",
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
        {
          text: "Image",
          align: "start",
          sortable: true,
          value: "image",
        },
      ],
      techniques: [],
    };
  },
  apollo: {
    techniques: {
      prefetch: true,
      query: techniques,
    },
  },
};
</script>
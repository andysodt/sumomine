<template>
  <v-data-table
    :headers="headers"
    :items="heya_ichimon"
    :items-per-page="500"
    class="elevation-1"
  >
    <template #item.heya.image="{ item }">
      <img :height="100" :src="item.heya.image" />
    </template>
  </v-data-table>
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
          text: "一門",
          align: "start",
          sortable: true,
          value: "ichimon.name",
        },
        {
          text: "Heya",
          align: "start",
          sortable: true,
          value: "heya.name_eng",
        },
        {
          text: "Ichimon",
          align: "start",
          sortable: true,
          value: "ichimon.name_eng",
        },
        {
          text: "Joined",
          align: "start",
          sortable: true,
          value: "date_joined",
        },
        {
          text: "Quit",
          align: "start",
          sortable: true,
          value: "date_quit",
        },
        {
          text: "Image",
          align: "start",
          sortable: true,
          value: "heya.image",
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
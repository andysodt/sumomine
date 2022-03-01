<template>
  <v-card>
    <v-card-title>
      り手 techniques
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="techniques"
      :items-per-page="500"
      :search="search"
      class="elevation-1"
    >
      <template #item.image="{ item }">
        <img :height="100" :src="item.image" />
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import techniques from "~/apollo/queries/fetchTechniques";

export default {
  data() {
    return {
      search: "",
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
<template>
  <v-card>
    <v-card-title>
      決まり手 kimarite
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
      :items="kimarite"
      :items-per-page="500"
      :multi-sort="true"
      :search="search"
      class="elevation-1"
    >
      <template #item.image="{ item }">
        <img :height="100" :src="item.image" />
      </template>

      <template #item.name="{ item }">
        <NuxtLink :to="'/kimarite/'+item.id">
          {{ item.name }}
        </NuxtLink>
      </template>

      <template #item.name_eng="{ item }">
        <NuxtLink :to="'/kimarite/'+item.id">
          {{ item.name_eng }}
        </NuxtLink>
      </template>
      
    </v-data-table>
  </v-card>
</template>

<script>
import kimarite from "~/apollo/queries/fetchKimarite";

export default {
  data() {
    return {
      search: "",
      headers: [
        {
          text: "決まり手",
          align: "start",
          sortable: true,
          value: "name",
        },
        {
          text: "Catagory",
          align: "start",
          sortable: true,
          value: "kimarite_type.name",
        },
        {
          text: "Technique",
          align: "start",
          sortable: true,
          value: "name_eng",
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
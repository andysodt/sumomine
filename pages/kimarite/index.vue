<template>
  <div class="">
    <h1 style="text-align: center">Kimarite</h1>
    <v-data-table
      :page="page"
      :pageCount="numberOfPages"
      :headers="headers"
      :items="kimarite"
      :options.sync="options"
      :server-items-length="totalPassengers"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:item.name="{ item }">
        {{ item.name }}
      </template>
      <template v-slot:item.name_eng="{ item }">
        {{ item.name_eng }}
      </template>
    </v-data-table>
  </div>
</template>


<script>
import kimarite from "~/apollo/queries/fetchKimarite";

export default {
  apollo: {
    kimarite: {
      prefetch: true,
      query: kimarite,
    },
  },
  head: {
    title: "Kimarite",
  },
};
</script>

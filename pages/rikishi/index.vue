<template>
  <vue-virtual-table :config="tableConfig" :data="tableData">
  </vue-virtual-table>
</template>

<script>
import rikishi from "~/apollo/queries/fetchRikishi";
import VueVirtualTable from "vue-virtual-table";
export default {
  components: {
    VueVirtualTable,
  },
  data: () => ({
    tableConfig: [{ prop: "shikona" }, { prop: "heya" }],
    tableData: [
      { shikona: "a1", heya: 20 },
      { shikona: "a2", heya: 21 },
      { shikona: "a3", heya: 23 },
    ],
  })
};
</script>

<style>
ul {
  list-style-type: none;
  margin: 10;
  padding: 10;
  line-height: 1.6;
}
a {
  text-decoration: none;
  color: #005a69;
}
a:hover {
  border-bottom: 1px solid;
}
</style>

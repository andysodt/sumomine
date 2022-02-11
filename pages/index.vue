<template>
  <div>
    <h3>Kimarite Type</h3>
    <ul>
      <li v-for="item in kimarite_type" :key="item.id">
        <nuxt-link :to="`/kimarite/${item.id}`">
          {{ item.name }} {{ item.name_eng }}
        </nuxt-link>        
      </li>
    </ul>
  </div>
</template>

<script>
import kimarite_type from '~/apollo/queries/fetchKimariteType'

export default {
  apollo: {
    kimarite_type: {
      prefetch: true,
      query: kimarite_type
    }
  },
  head: {
    title: 'Kimarite Type'
  }
}
</script>

<style>
ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
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

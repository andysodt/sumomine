<template>
  <div>
    <h3>Kimarite</h3>
    <ul>
      <li v-for="item in kimarite" :key="item.id">
        <nuxt-link :to="`/kimarite/${item.id}`">
          {{ item.name }} {{ item.name_eng }}
        </nuxt-link>        
      </li>
    </ul>
  </div>
</template>

<script>
import kimarite from '~/apollo/queries/fetchKimarite'

export default {
  apollo: {
    kimarite: {
      prefetch: true,
      query: kimarite
    }
  },
  head: {
    title: 'Kimarite'
  }
}
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

<template>
  <div>
    <h3>Rikishi</h3>
    <ul>
      <li v-for="item in rikishi" :key="item.id">
        <nuxt-link :to="`/rikishi/${item.id}`">
          {{ item.shikone }} {{ item.heya }}
        </nuxt-link>        
      </li>
    </ul>
  </div>
</template>

<script>
import rikishi from '~/apollo/queries/fetchRikishi'

export default {
  apollo: {
    rikishi: {
      prefetch: true,
      query: rikishi
    }
  },
  head: {
    title: 'Rikishi'
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

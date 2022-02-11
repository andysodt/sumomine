<template>
  <div v-if="rikishi">
    <div v-for="item in rikishi" :key="item.id">
      <h3>{{ item.shikona }} {{ item.heya }}</h3>
    </div>
  </div>
</template>

<script>
import kimarite from '~/apollo/queries/fetchRikishi'

export default {
  apollo: {
    rikishi: {
      query: rikishi,
      prefetch: ({ route }) => ({ id: route.params.id }),
      variables() {
        return { id: this.$route.params.id }
      }
    }
  },
  head() {
    return {
      title: 'Rikishi'
    }
  }
}
</script>


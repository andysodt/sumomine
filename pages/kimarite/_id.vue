<template>
  <div v-if="kimarite">
    <div v-for="item in kimarite" :key="item.id">
      <h3>{{ item.name }} {{ item.name_eng }}</h3>
      <p>{{ item.description }} {{ item.description_eng }}</p>
    </div>
  </div>
</template>

<script>
import kimarite_by_type from '~/apollo/queries/fetchKimariteByType'

export default {
  apollo: {
    kimarite: {
      query: kimarite_by_type,
      prefetch: ({ route }) => ({ id: route.params.id }),
      variables() {
        return { id: this.$route.params.id }
      }
    }
  },
  head() {
    return {
      title: 'Kimarite by Type'
    }
  }
}
</script>


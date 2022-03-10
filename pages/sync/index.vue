<template>
  <div class="row mt-5">
    <div class="card-group">
      <div class="row">
        <div class="col-md-8">
          <Banzuke v-for="(banzuke, i) in banzukeList" :key="i" :banzuke="banzuke" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  async asyncData({ store }) {
    const getBanzuke = store.getters['banzuke/getBanzuke']
    let banzukeList = getBanzuke()
    if (!banzukeList.length) {
      banzukeList = await store.dispatch('banzuke/getBanzuke')
    }
    return { banzukeList }
  },
}
</script>
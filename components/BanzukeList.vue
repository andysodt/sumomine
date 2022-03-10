<template>
  <section>
    <div class="row mt-5">
      <div class="card-group">
        <div class="row">
          <div class="col-md-8">
            <Banzuke v-for="(banzuke, i) in banzukeList" :key="i" :banzuke="banzuke" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import { mapState } from 'vuex'
export default {
  computed: {
    ...mapState({
      banzukeList: (state) => {
        return [...state.banzuke.banzuke].slice(0, 10)
      },
    }),
  },
}
</script>
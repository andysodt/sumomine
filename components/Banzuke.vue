<template>
  <div class="card mt-3 mb-5 pb-5">
    <div class="card-header">
      <div class="card-title title">
        <h3>
        	{{ banzuke.title }}
        </h3>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Banzuke',
  props: {
    banzuke: {
      type: [Array, Object],
      default: () => {},
    },
  },
}
</script>

<style></style>
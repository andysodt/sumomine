export const actions = {
	async nuxtServerInit({ dispatch }) {
	  try {
		await dispatch('banzuke/getBanzuke')
	  } catch (error) {}
	},
  }
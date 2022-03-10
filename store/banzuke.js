import BanzukeScrapper from '~/BanzukeScrapper'

export const state = () => ({
  banzuke: [],
  total_banzuke: 0,
})

export const getters = {
  getBanzuke: (state) => () => {
    return state.banzuke
  },
}

export const mutations = {
  STORE_BANZUKE(state, payload) {
    state.banzuke = payload.banzuke
    state.total_banzuke = payload.total_banzuke
  },
}

export const actions = {
  async getBanzuke({ commit }) {
    const data = await BanzukeScrapper.getBanzuke()
    if (data.total_banzuke) {
      commit('STORE_BANZUKE', data)
      return data.banzuke
    }
  },
}
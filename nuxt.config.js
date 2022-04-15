const pkg = require('./package')

module.exports = {

  /*
  ** Headers of the page
  */
  head: {
    title: pkg.name,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: pkg.description }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },

  /*
  ** Global CSS
  */
  css: [
  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  ],

  components: true,

  /*
  ** Nuxt.js modules
  */
  modules: ['@nuxtjs/apollo', '@nuxtjs/vuetify', '@nuxt/http'],

  /*
  ** HTTP module configuration
  */
  http: {
    // See https://http.nuxtjs.org/api/#options
  },

  // Give apollo module options
  apollo: {
    cookieAttributes: {
      expires: 7, // optional, default: 7 (days)
    },
    includeNodeModules: true, // optional, default: false (this includes graphql-tag for node_modules folder)
    authenticationType: 'Bearer', // optional, default: 'Bearer'
    // optional
    errorHandler: '~/plugins/apollo-error-handler.js',
    // required
    clientConfigs: {
      default: '~/apollo/clientConfig.js'
    }
  },

  /*
  ** Build configuration
  */
  build: {
    extend(config, { isServer, isClient }) {

      if (isClient) {
        config.devtool = 'eval-source-map'
      }

      config.externals = config.externals || {}
      if (!isServer) {
        config.node = {
          fs: 'empty',
        }
        if (Array.isArray(config.externals)) {
          config.externals.push({
            puppeteer: require('puppeteer'),
          })
        } else {
          config.externals.puppeteer = require('puppeteer')
        }
      }
      config.output.globalObject = 'this'
      return config
    },
  }
}

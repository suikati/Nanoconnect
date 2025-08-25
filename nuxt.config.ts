// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/theme.css'],
  runtimeConfig: {
    public: {
      // Firebase public config (safe to be public: API key is not a secret)
      firebase: {
        apiKey: 'AIzaSyB_6LUu_oKkNHeJmNg1F5YoJJKQ9RFJAhk',
        authDomain: 'nanoconnect-7ba2e.firebaseapp.com',
        projectId: 'nanoconnect-7ba2e',
        storageBucket: 'nanoconnect-7ba2e.firebasestorage.app',
        messagingSenderId: '644712339813',
        appId: '1:644712339813:web:fc6cb4cb6daa6fe073698c',
        measurementId: 'G-8ZQBRSX360',
        databaseURL: 'https://nanoconnect-7ba2e-default-rtdb.asia-southeast1.firebasedatabase.app',
      },
    },
    private: {
      openaiApiKey: process.env.OPENAI_KEY
    }
  },
});

// https://github.com/vuejs/vue-router-next/blob/master/playground/shim.d.ts
// https://github.com/vuejs/vue-next-webpack-preview/issues/5
declare module '*.vue' {
  import { Component } from 'vue'
  var component: Component
  export default component
}

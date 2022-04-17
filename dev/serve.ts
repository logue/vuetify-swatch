import { createApp, isVue3, Vue2 } from 'vue-demi';
import vuetify from './plugins/vuetify';
import Dev from './serve.vue';

if (isVue3) {
  console.info('ℹ Running as Vue3.');
  createApp(Dev).mount('#app');
} else {
  console.info('ℹ Running as Vue2.');
  Vue2.config.productionTip = false;
  new Vue2({
    vuetify,
    render: h => h(Dev),
  }).$mount('#app');
}

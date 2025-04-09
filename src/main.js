// import './assets/main.css'
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './style.css'; // 순수 CSS

createApp(App).use(router).mount('#app');

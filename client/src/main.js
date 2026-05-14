import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';
import './assets/main.css';

// ── Dark mode: aplicar desde localStorage o default dark ──────────────────────
const saved = localStorage.getItem('motoros-theme')
if (saved === 'light') {
  document.documentElement.classList.remove('dark')
} else {
  // Default: dark mode
  document.documentElement.classList.add('dark')
  if (!saved) localStorage.setItem('motoros-theme', 'dark')
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

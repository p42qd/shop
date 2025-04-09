import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import Product from '../pages/Product.vue';
import CategoryManager from '../pages/CategoryManager.vue';
import ProductAdd from '../pages/ProductAdd.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/product/:id', component: Product },
  { path: '/admin/categories', component: CategoryManager },
  { path: '/admin/products/add', component: ProductAdd }, // ✅ 추가
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
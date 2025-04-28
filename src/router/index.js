import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import Product from '../pages/Product.vue';
import ProductAdd from '../pages/ProductAdd.vue';
import Search from '../pages/Search.vue';

import AdminDashboard from '../pages/AdminDashboard.vue'
import CategoryManager from '../pages/CategoryManager.vue';
import CategoryProducts from '../pages/CategoryProducts.vue';
import Calculator from '../pages/Calculator.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/product/:id', component: Product },
  { path: '/search', component: Search },
  { path: '/category/:categoryId', component: CategoryProducts },
  
  { path: '/desk-control', component: AdminDashboard, meta: { requiresAuth: true } },
  { path: '/desk-control/categories', component: CategoryManager, meta: { requiresAuth: true } },
  { path: '/desk-control/products/add', component: ProductAdd, meta: { requiresAuth: true } },
  { path: '/desk-control/calculator', component: Calculator, meta: { requiresAuth: true } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,

  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  }
});

// 여기에 비밀번호 확인 로직 추가
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const loginData = JSON.parse(localStorage.getItem('adminLogin'));

    if (loginData && loginData.loggedIn && loginData.expireAt > Date.now()) {
      // 이미 로그인되어 있고 아직 유효함
      next();
    } else {
      const password = prompt('관리자 비밀번호를 입력하세요. :');

      if (password === 'eotmd1128^^') { // ← 비밀번호 맞으면
        const now = new Date();
        const expire = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후

        localStorage.setItem('adminLogin', JSON.stringify({
          loggedIn: true,
          expireAt: expire.getTime()
        }));

        next();
      } else {
        alert('비밀번호가 틀렸습니다.');
        next('/'); // 틀리면 메인페이지로 보내기
      }
    }
  } else {
    next();
  }
});

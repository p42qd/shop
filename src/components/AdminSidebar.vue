<template>
  <aside class="sidebar">
    <button
      v-for="item in menuItems"
      :key="item.name"
      class="category"
      :class="{ active: $route.path === item.route }"
      @click="navigate(item.route)"
    >
      {{ item.name }}
    </button>
  </aside>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { name: '상품관리', route: '/desk-control/products' },
  { name: '하마오 계산기', route: '/desk-control/calculator' },
  { name: '하마오 메인 페이지', route: '/' }
]

function navigate(path) {
  router.push(path)
}
</script>

<style scoped>
.sidebar {
  width: 220px; /* 메인 페이지 사이드바와 동일한 값으로 설정 */
  min-width: 220px;
  max-width: 220px;
  flex-shrink: 0; /* 줄어들지 않게 */
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  display: none;
}
@media (min-width: 768px) {
  .sidebar {
    display: block;
  }
}

.category {
  display: block;
  width: 100%;
  text-align: left;
  margin: 6px 0;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid #ddd;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  font-size: 15px;
  color: #333;
  cursor: pointer;
}
.category:hover {
  background-color: #f9fafb;
}
.category.active {
  border-color: #b0934d;
  background-color: #fff8e7;
  color: #b0934d;
  font-weight: bold;
}
</style>

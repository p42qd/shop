<template>
  <header class="header">
    <div class="title" @click="goToMain()">
      <img src="../assets/icnos/hamao_logo.png" alt="이미지" class="hamao-logo" />
      <img src="../assets/icnos/hamao_text.png" alt="HAMAO" class="hamao-text" />
    </div>

    <div class="hamburger">
      <span class="material-symbols-outlined" v-if="route.path === '/'" @click="$emit('toggle-menu')">menu</span>
    </div>

    <form class="search-form" @submit.prevent="onSearch">
      <div class="search-wrapper">
        <input
          class="search-input"
          type="text"
          v-model="search"
          placeholder="검색어를 입력하세요"
        />
        <button type="submit" class="search-btn">
          <span class="material-symbols-outlined">search</span>
        </button>
      </div>
    </form>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

defineEmits(['toggle-menu'])

const router = useRouter();
const route = useRoute();
const search = ref('');
const categoryMap = ref({});

function goToMain() {
  router.push(`/`);
}

function onSearch() {
  if (!search.value.trim()) return;
  router.push(`/search?query=${encodeURIComponent(search.value.trim())}`);
}
</script>

<style scoped>
.header {
  display: flex;
  position: fixed;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  top: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  background-color: #f8f9fa;
  color: #1f1f1f;
  z-index: 1;
}

.hamburger {
  padding: 3px;
}

.hamburger span,
.material-symbols-outlined {
  color: #333;
}

@media (min-width: 768px) {
  .hamburger {
    display: none;
  }
  .header .title {
    width: 200px !important;
  }
  .hamao-logo {
    width: 35px;
    height: 35px;
  }
  .hamao-text {
    height: 35px;
  }
  .mobile-sidebar {
    display: none;
  }
}

.header .title {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin: 15px 0;
}

.hamao-logo {
  width: 35px;
  height: 35px;
}

.hamao-text {
  height: 35px;
}

/* 🔍 검색창 */
.search-form {
  max-width: 400px;
}
.search-wrapper {
  position: relative;
  width: 100%;
}
.search-input {
  padding: 10px 44px 10px 16px;
  font-size: 15px;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  outline: none;
  transition: all 0.2s ease;
  border: 1px solid #bbb;
  background-color: #ffffff;
  color: #1f1f1f;
}
.search-input:focus {
  border-color: #b0934d;
  box-shadow: 0 0 0 2px rgba(176, 147, 77, 0.2);
}
.search-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #b0934d;
  font-size: 22px;
}

</style>

<template>
  <Header @toggle-menu="toggleMenu"/>

  <div class="mobile-menu" v-if="mobileMenuToggle">
    <aside class="mobile-sidebar">
      <div v-for="(cat, catName) in categoryMap" :key="cat.id">
        <button
          class="category"
          :class="{ active: selectedCategoryId === cat.id }"
          @click="toggleCategory(cat.id)"
        >
          {{ catName }}
        </button>
        <div v-if="selectedCategoryId === cat.id">
          <button
            v-for="sub in cat.subs"
            :key="sub.id"
            class="subcategory"
            :class="{ active: selectedSubId === sub.id }"
            @click="toggleSubCategory(sub.id)"
          >
            {{ sub.name }}
          </button>
        </div>
      </div>
    </aside>
  </div>

  <div class="container">
    <div class="layout">
      <!-- 카테고리 사이드바 -->
      <aside class="sidebar">
        <div v-for="(cat, catName) in categoryMap" :key="cat.id">
          <button
            class="category"
            :class="{ active: selectedCategoryId === cat.id }"
            @click="toggleCategory(cat.id)"
          >
            {{ catName }}
          </button>
          <div v-if="selectedCategoryId === cat.id">
            <button
              v-for="sub in cat.subs"
              :key="sub.id"
              class="subcategory"
              :class="{ active: selectedSubId === sub.id }"
              @click="toggleSubCategory(sub.id)"
            >
              {{ sub.name }}
            </button>
          </div>
        </div>
      </aside>

      <!-- 상품 섹션 -->
      <main class="main">
        <div class="top-info">
          <div class="notice">
            📢 홈페이지에 없는 상품은 아래 연락처로 문의 주세요.
          </div>
          <div class="socials">
            <div class="line">
              <span><img src="../assets/icnos/kakaotalk.png" alt="카카오톡" class="sns-icon" />hamao</span>
              <span><img src="../assets/icnos/instagram.png" alt="인스타그램" class="sns-icon" />hamao_select</span>
            </div>
            <div class="line">
              <span><img src="../assets/icnos/telegram.png" alt="텔레그램" class="sns-icon" />hamaobuy</span>
            </div>
          </div>
        </div>
        <section
          v-for="(cat, catName) in filteredCategoryMap"
          :key="cat.id"
          class="category-section"
        >
          <h2>{{ catName }}</h2>
          <div v-if="filteredByCategory(cat.id).length">
            <div class="grid">
              <div
                v-for="product in filteredByCategory(cat.id).slice(0, 8)"
                :key="product.id"
                class="card"
                @click="goToDetail(product.id)"
              >
                <img :src="product.image_url" :alt="product.name" />
                <div class="card-body">
                  {{ product.name }}<br />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-message">
            <p>상품이 없습니다.</p>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

import Header from '@/components/Header.vue'; 

const router = useRouter();
const searchQuery = ref('');
const selectedCategoryId = ref(null);
const selectedSubId = ref(null);
const categoryMap = ref({});
const PRODUCTS = ref([]);
const mobileMenuToggle = ref(false)

function toggleMenu() {
  mobileMenuToggle.value = !mobileMenuToggle.value
}

function toggleCategory(id) {
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = null;
    selectedSubId.value = null;
    mobileMenuToggle.value = false;
  } else {
    selectedCategoryId.value = id;
    selectedSubId.value = null;
    const category = Object.values(categoryMap.value).find(cat => cat.id === id);
    if (!category?.subs?.length) {
      mobileMenuToggle.value = false;
      router.push(`/category/${id}`);
    }
  }
}

function toggleSubCategory(id) {
  selectedSubId.value = selectedSubId.value === id ? null : id;
  mobileMenuToggle.value = false;
  router.push(`/category/${selectedCategoryId.value}?sub_id=${id}`);
}

function goToDetail(id) {
  router.push(`/product/${id}`);
}

const filteredCategoryMap = computed(() => {
  if (!selectedCategoryId.value) return categoryMap.value;
  const result = {};
  for (const [name, cat] of Object.entries(categoryMap.value)) {
    if (cat.id === selectedCategoryId.value) {
      result[name] = cat;
    }
  }
  return result;
});

function filteredByCategory(categoryId) {
  return PRODUCTS.value.filter(p => {
    const matchCat = p.category_id === categoryId;
    const matchSub = selectedSubId.value ? p.sub_id === selectedSubId.value : true;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchCat && matchSub && matchSearch;
  });
}

onMounted(async () => {
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .select('id, name, subcategories(id, name)')
    .order('id');

  if (!catErr) {
    const map = {};
    catData.forEach(cat => {
      map[cat.name] = {
        id: cat.id,
        subs: cat.subcategories || [],
      };
    });
    categoryMap.value = map;
  }

  const { data: prodData, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price, image_url, category_id, sub_id');

  if (!prodErr) {
    PRODUCTS.value = prodData;
  }
});
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
}
@media (min-width: 768px) {
  .layout {
    flex-direction: row;
  }
}

.sidebar {
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  display: none;
}
@media (min-width: 768px) {
  .sidebar {
    width: 220px;
    display: block;
  }
  .mobile-sidebar {
    display: none;
  }
}

/* 카테고리 버튼 */
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
}

/* 소분류 버튼 */
.subcategory {
  display: block;
  width: 100%;
  padding: 8px 16px 8px 32px; /* ← 왼쪽 들여쓰기 */
  font-size: 14px;
  text-align: left;
  background-color: #f8f9fa;
  border: none;
  border-radius: 10px;
  color: #555;
  transition: background 0.2s ease;
}

/* hover 스타일 */
.category:hover {
  background-color: #f9fafb;
}
.subcategory:hover {
  background-color: #e9ecef;
}

/* 활성화 상태 */
.category.active {
  border-color: #b0934d;
  background-color: #fff8e7;
  color: #b0934d;
  font-weight: bold;
}
.subcategory.active {
  background-color: #b0934d;
  color: white;
  font-weight: bold;
}

/* 상단 안내 + SNS */
.top-info {
  background-color: #ffffff;
  padding: 18px 12px;
  font-size: 15px;
  line-height: 1.5;
  border-bottom: 1px solid #ddd;
  color: #2b2b2b;
  text-align: center;
}
.notice {
  font-weight: bold;
  color: #a67c00;
  margin-bottom: 4px;
}
.socials {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  gap: 4px;
  line-height: 1.4;
  margin-top: 4px;
  text-align: center;
}
.socials .line {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.sns-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin-right: 4px;
}
.socials span {
  display: flex;
  align-items: center;
  font-weight: bold;
  gap: 4px;
}
@media (min-width: 768px) {
  .top-info {
    padding: 24px;
  }
  .socials {
    flex-direction: row;
    justify-content: center;
    gap: 16px;
  }
  .socials .line {
    flex-wrap: nowrap;
  }
}

.main {
  flex: 1;
  background: #ffffff;
  padding: 0px 16px 16px 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.main h2 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: bold;
  color: #444;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

.card {
  background: #ffffff;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.1s;
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}
.card-body {
  padding: 10px;
  font-size: 14px;
  text-align: center;
  background: #f8f9fa;
  color: #1f1f1f;
}

.category-section {
  margin-bottom: 32px;
}
.empty-message {
  padding: 20px;
  color: #888;
  background: #f4f4f4;
  text-align: center;
  border-radius: 6px;
  font-size: 14px;
}


/* 📱 모바일 메뉴 */
.mobile-menu {
  position: fixed;
  top: 145px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.mobile-sidebar {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 0 0 8px 8px;
  padding: 12px;
}

/* ✅ 카테고리 & 소분류 (모바일) */
.mobile-sidebar .category {
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
}

.mobile-sidebar .category:hover {
  background-color: #f9fafb;
}

.mobile-sidebar .category.active {
  border-color: #b0934d;
  background-color: #fff8e7;
  color: #b0934d;
  font-weight: bold;
}

.mobile-sidebar .subcategory {
  display: block;
  width: 100%;
  padding: 8px 16px 8px 32px;
  font-size: 14px;
  text-align: left;
  background-color: #f8f9fa;
  border: none;
  border-radius: 10px;
  color: #555;
  transition: background 0.2s ease;
  margin: 4px 0;
}

.mobile-sidebar .subcategory:hover {
  background-color: #e9ecef;
}

.mobile-sidebar .subcategory.active {
  background-color: #b0934d;
  color: white;
  font-weight: bold;
}
</style>



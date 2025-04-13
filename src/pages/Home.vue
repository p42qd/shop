<template>
  <div class="container">
    <header class="header">
      <h1>Simple Wear</h1>
      <!-- <div class="admin-buttons">
        <router-link to="/admin/categories">
          <button class="admin-button">카테고리 관리</button>
        </router-link>
        <router-link to="/admin/products/add">
          <button class="admin-button">상품 등록</button>
        </router-link>
      </div> -->
      <div class="hamburger" @click="menuOpen = !menuOpen">
        <i data-lucide="menu"></i>
      </div>
      <form class="search-form">
        <input class="search" type="text" placeholder="검색어를 입력하세요" />
        <button type="submit">
          <i data-lucide="search"></i>
        </button>
      </form>
    </header>
    <div class="mobile-menu" v-if="menuOpen">
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
              ㆍ{{ sub.name }}
            </button>
          </div>
        </div>
      </aside>
    </div>

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
              ㆍ{{ sub.name }}
            </button>
          </div>
        </div>
      </aside>

      <!-- 상품 섹션 -->
      <main class="main">
        <!-- 상단 공지 및 SNS -->
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
                  <span>{{ formatPrice(product.price) }}원</span>
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

const router = useRouter();

const searchQuery = ref('');
const selectedCategoryId = ref(null);
const selectedSubId = ref(null);

const categoryMap = ref({});
const PRODUCTS = ref([]);
const menuOpen = ref(false)

function formatPrice(price) {
  return Number(price).toLocaleString();
}

function toggleCategory(id) {
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = null;
    selectedSubId.value = null;
  } else {
    selectedCategoryId.value = id;
    selectedSubId.value = null;
  }
}

function toggleSubCategory(id) {
  menuOpen.value = false
  selectedSubId.value = selectedSubId.value === id ? null : id;
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

  if (catErr) {
    console.error('❌ 카테고리 불러오기 실패:', catErr.message);
  } else {
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

  if (prodErr) {
    console.error('❌ 상품 불러오기 실패:', prodErr.message);
  } else {
    PRODUCTS.value = prodData;
  }
});
</script>

<style scoped>
.container {
  /* padding: 24px; */
  background-color: #f9fafb;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  margin-top: 140px;
}
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
  padding-right: 5px;
  padding-left: 5px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ddd;
  background-color: #fff;
  z-index: 1;
}

.mobile-menu {
  position: fixed;
  top: 131px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.hamburger {
  padding: 3px;
}

.hamburger i {
  width: 25px;
  height: 25px;
}

@media (min-width: 768px) {
  .container {
    /* padding: 24px; */
    margin-top: 70px;
  }
  .header {
    padding-bottom: 0px;
    padding-left: 24px;
    padding-right: 24px;
  }
  .hamburger {
    display: none;
  }
  .header h1 {
    width: 200px !important;
    font-size: 24px;
    font-weight: bold;
    color: #222;
  }
}

.header h1 {
  font-size: 24px;
  text-align: center;
  width: 100%;
  font-weight: bold;
  color: #222;
}
.search-form {
  display: flex;
  align-items: center;
}

.search-form button {
  padding: 8px;
  background-color: #007BFF;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  color: white;
}

.search-form button i {
  width: 20px;
  height: 20px;
}

.search {
  padding: 8px;
  font-size: 16px;
  height: 25px;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  outline: none;
}
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
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  display: none;
}

.mobile-sidebar {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 0px 0px 8px 8px;
  padding: 12px;
}
@media (min-width: 768px) {
  .mobile-sidebar {
    display: none
  }
  .sidebar {
    width: 220px;
    display: block;
  }
}
.category,
.subcategory {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  margin: 4px 0;
  border: none;
  border-radius: 6px;
  background: #f2f4f6;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background 0.2s;
}
.category:hover,
.subcategory:hover {
  background-color: #e4efff;
}
.category.active,
.subcategory.active {
  background-color: #cce2ff;
  font-weight: bold;
}
.top-info {
  background-color: #fefefe;
  padding: 18px 12px;
  font-size: 15px;
  line-height: 1.5;
  border-bottom: 1px solid #ddd;
  color: #333;
  text-align: center;
}
.notice {
  font-weight: bold;
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
    font-size: 15px;
    padding: 24px 24px;
  }
  .notice {
    margin-bottom: 2px;
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
  background: #fff;
  padding:0px 16px 16px 16px;
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
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.1s;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  background: #fafafa;
}
.category-section {
  margin-bottom: 32px;
}
.empty-message {
  padding: 20px;
  color: #888;
  background: #f9f9f9;
  text-align: center;
  border-radius: 6px;
  font-size: 14px;
}
.admin-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}
.admin-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.admin-button:hover {
  background-color: #0056b3;
}
</style>

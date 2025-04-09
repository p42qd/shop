<template>
  <div class="container">
    <header class="header">
      <h1>Simple Wear</h1>
      <input v-model="searchQuery" placeholder="상품 검색" class="search" />
    </header>

    <!-- 관리자 페이지 버튼들 -->
    <div class="admin-buttons">
      <router-link to="/admin/categories">
        <button class="admin-button">카테고리 관리</button>
      </router-link>
      <router-link to="/admin/products/add">
        <button class="admin-button">상품 등록</button>
      </router-link>
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
  selectedSubId.value = selectedSubId.value === id ? null : id;
}

function goToDetail(id) {
  router.push(`/product/${id}`);
}

// ⭐ 카테고리 필터된 목록만 표시
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

// ⭐ 카테고리별 상품 필터링
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
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #ddd;
}
.header h1 {
  font-size: 24px;
  font-weight: bold;
  color: #222;
}
.search {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 220px;
  font-size: 14px;
}
.layout {
  display: flex;
  gap: 20px;
  margin-top: 24px;
}
.sidebar {
  width: 220px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
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
.main {
  flex: 1;
  background: #fff;
  padding: 16px;
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
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
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

/* 관리자 페이지 버튼 스타일 */
.admin-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  justify-content: center;
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

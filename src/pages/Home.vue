<template>
  <div class="container">
    <div class="layout">
      <CategorySidebar/>
      <!-- 상품 메인 -->
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
          v-for="(cat, catName) in categoryMap"
          :key="cat.id"
          class="category-section"
        >
          <div class="category-header">
            <h2>{{ catName }}</h2>
            <button class="more-button" @click="goToCategory(cat.id)">더보기+</button>
          </div>

          <div v-if="getProductsByCategory(cat.id).length">
            <div class="grid">
              <div
                v-for="product in getProductsByCategory(cat.id)"
                :key="product.id"
                class="card"
                @click="goToDetail(product.id)"
              >
                <img :src="product.image_url" :alt="product.name" />
                <div class="card-body">
                  {{ product.name }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-message">
            <p>상품 준비중입니다.</p>
          </div>
        </section>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

import CategorySidebar from '@/components/CategorySidebar.vue'

const router = useRouter();
const categoryMap = ref({});
const PRODUCTS = ref([]);

// 특정 카테고리 상품 4개 이하로 가져오기
function getProductsByCategory(categoryId) {
  const list = PRODUCTS.value.filter(p => p.category_id === categoryId);
  return window.innerWidth < 768 ? list.slice(0, 4) : list;
}

// 카테고리 상세 페이지 이동
function goToCategory(categoryId) {
  router.push(`/category/${categoryId}`);
}

// 상품 상세 페이지 이동
function goToDetail(productId) {
  router.push(`/product/${productId}`);
}

onMounted(async () => {
  // 카테고리 가져오기
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .select('id, name, subcategories(id, name)')
    .order('id');

  if (!catErr && catData) {
    const map = {};
    catData.forEach(cat => {
      map[cat.name] = {
        id: cat.id,
        subs: cat.subcategories || [],
      };
    });
    categoryMap.value = map;
  }

  // 상품 가져오기
  const { data: prodData, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price, image_url, category_id, sub_id');

  if (!prodErr && prodData) {
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

.main {
  flex: 1;
  background: #ffffff;
  padding: 0px 16px 16px 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
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

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-header h2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.more-button {
  font-size: 13px;
  font-weight: normal;
  color: #999999;
  background: none;
  border: none;
  cursor: pointer;
}
.more-button:hover {
  color: #b0934d;
  text-decoration: underline;
}
</style>

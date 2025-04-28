<template>
    <div class="admin-dashboard">
      <h1>관리자 대시보드</h1>
  
      <!-- 상단 버튼 -->
      <div class="button-group">
        <router-link to="/desk-controls/products/add" class="button">상품 추가</router-link>
        <router-link to="/desk-control/calculator" class="button">하마오 계산기</router-link>
      </div>
  
      <!-- 통계 -->
      <div class="stats">
        <div class="stat-item">
          <div class="title">총 상품 수</div>
          <div class="value">{{ totalProducts }}</div>
        </div>
        <div class="stat-item">
          <div class="title">총 카테고리 수</div>
          <div class="value">{{ totalCategories }}</div>
        </div>
        <div class="stat-item">
          <div class="title">오늘 등록 상품</div>
          <div class="value">{{ todayProducts }}</div>
        </div>
      </div>
  
      <!-- 중간 (카테고리/소분류 관리 + 최근 등록 상품) -->
      <div class="section two-column">
        <!-- 왼쪽: 카테고리 + 소분류 관리 -->
        <div class="column">
          <h2>카테고리 + 소분류 관리</h2>
  
          <!-- 카테고리 추가 -->
          <div class="form">
            <input v-model="newCategoryName" placeholder="새 카테고리 이름" />
            <button @click="addCategory">카테고리 추가</button>
          </div>
  
          <!-- 카테고리 리스트 -->
          <div class="category-grid">
            <div v-for="cat in categories" :key="cat.id" class="category-card">
              <div class="card-header">
                <input v-model="cat.name" class="category-name" />
                <div class="card-buttons">
                  <button @click="updateCategory(cat)">수정</button>
                  <button @click="deleteCategory(cat.id)">삭제</button>
                  <button @click="toggleSubcategories(cat)">
                    {{ cat.isOpen ? '▲' : '▼' }}
                  </button>
                </div>
              </div>
  
              <div class="count">상품 수: {{ cat.product_count }}</div>
  
              <!-- 접힘 상태일 때: 소분류 요약 -->
              <div v-if="!cat.isOpen" class="subcategory-summary">
                소분류:
                <span v-if="cat.subcategories.length">
                  {{ cat.subcategories.map(sub => sub.name).join(', ') }}
                </span>
                <span v-else>없음</span>
              </div>
  
              <!-- 펼침 상태일 때: 소분류 상세 -->
              <div v-if="cat.isOpen">
                <div class="sub-form">
                  <input v-model="cat.newSubName" placeholder="새 소분류 추가" />
                  <button @click="addSubcategory(cat.id, cat.newSubName)">+</button>
                </div>
  
                <div v-for="sub in cat.subcategories" :key="sub.id" class="subcategory-item">
                  <input v-model="sub.name" class="subcategory-name" />
                  <div class="sub-buttons">
                    <button @click="updateSubcategory(sub)">수정</button>
                    <button @click="deleteSubcategory(sub.id)">삭제</button>
                  </div>
                  <div class="sub-count">상품 수: {{ sub.product_count }}</div>
                </div>
              </div>
  
            </div>
          </div>
        </div>
  
        <!-- 오른쪽: 최근 등록 상품 -->
        <div class="column">
          <h2>최근 등록된 상품</h2>
          <div class="card-grid">
            <div v-for="product in recentProducts" :key="product.id" class="card">
              <img :src="product.image_url || 'https://via.placeholder.com/80x80?text=No+Image'" class="thumbnail" alt="썸네일" />
              <div class="card-info">
                <div class="card-title">{{ product.name }}</div>
                <div class="card-sub">{{ formatDate(product.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { supabase } from '../supabase'; // supabase 연결
  
  const totalProducts = ref(0);
  const totalCategories = ref(0);
  const todayProducts = ref(0);
  const recentProducts = ref([]);
  const categories = ref([]);
  const newCategoryName = ref('');
  
  // 날짜 포맷
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }
  
  // 대시보드 데이터 가져오기
  async function fetchDashboardData() {
  // 상품 수
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  totalProducts.value = productCount || 0;

  // 카테고리 수
  const { count: categoryCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });
  totalCategories.value = categoryCount || 0;

  // 오늘 등록된 상품 수
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const { data: todayProductsData } = await supabase
    .from('products')
    .select('*')
    .gte('created_at', startOfDay.toISOString());
  todayProducts.value = todayProductsData.length;

  // 최근 등록된 상품
  const { data: recent } = await supabase
    .from('products')
    .select('id, name, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  recentProducts.value = recent || [];
}

  
  // 카테고리 + 소분류 데이터 가져오기
  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, subcategories(id, name)')
      .order('id');
  
    if (error) {
      console.error('카테고리 불러오기 실패:', error.message);
      return;
    }
  
    const categoriesWithCounts = await Promise.all(
      data.map(async (cat) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('category_id', cat.id);
  
        const subcategoriesWithCounts = await Promise.all(
          cat.subcategories.map(async (sub) => {
            const { count: subCount } = await supabase
              .from('products')
              .select('*', { count: 'exact' })
              .eq('sub_id', sub.id);
            return { ...sub, product_count: subCount };
          })
        );
  
        return {
          ...cat,
          product_count: count,
          subcategories: subcategoriesWithCounts,
          newSubName: '',
          isOpen: false, // 접기/펼치기 상태
        };
      })
    );
  
    categories.value = categoriesWithCounts;
  }
  
  // 대분류 추가
  async function addCategory() {
    if (!newCategoryName.value.trim()) return;
    const { error } = await supabase.from('categories').insert({ name: newCategoryName.value });
    if (!error) {
      newCategoryName.value = '';
      fetchCategories();
    }
  }
  
  // 대분류 수정
  async function updateCategory(cat) {
    const { error } = await supabase.from('categories').update({ name: cat.name }).eq('id', cat.id);
    if (!error) fetchCategories();
  }
  
  // 대분류 삭제
  async function deleteCategory(id) {
    if (confirm('정말 삭제하시겠습니까? 관련 상품도 삭제됩니다.')) {
      await supabase.from('products').delete().eq('category_id', id);
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
    }
  }
  
  // 소분류 추가
  async function addSubcategory(category_id, name) {
    if (!name.trim()) return;
    const { error } = await supabase.from('subcategories').insert({ name, category_id });
    if (!error) fetchCategories();
  }
  
  // 소분류 수정
  async function updateSubcategory(sub) {
    const { error } = await supabase.from('subcategories').update({ name: sub.name }).eq('id', sub.id);
    if (!error) fetchCategories();
  }
  
  // 소분류 삭제
  async function deleteSubcategory(id) {
    if (confirm('정말 삭제하시겠습니까? 관련 상품도 삭제됩니다.')) {
      await supabase.from('products').delete().eq('sub_id', id);
      await supabase.from('subcategories').delete().eq('id', id);
      fetchCategories();
    }
  }
  
  // 소분류 접기/펼치기 토글
  function toggleSubcategories(cat) {
    cat.isOpen = !cat.isOpen;
  }
  
  // 마운트 시 데이터 로드
  onMounted(() => {
    fetchDashboardData();
    fetchCategories();
  });
  </script>
  
  <style scoped>
  .admin-dashboard {
    padding: 20px;
  }
  
  /* 상단 버튼 */
  .button-group {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .button {
    background: #007bff;
    color: white;
    padding: 10px 20px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    text-decoration: none;
    transition: background 0.2s;
  }
  
  .button:hover {
    background: #0056b3;
  }
  
  /* 통계 박스 */
  .stats {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-item {
    flex: 1;
    background: #ffffff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    text-align: center;
  }
  
  .stat-item .title {
    font-size: 16px;
    color: #777;
  }
  
  .stat-item .value {
    font-size: 28px;
    font-weight: bold;
    color: #007bff;
    margin-top: 8px;
  }
  
  /* 메인 레이아웃 */
  .section {
    margin-top: 30px;
  }
  
  .two-column {
    display: flex;
    gap: 20px;
  }
  
  .column {
    flex: 1;
    background: #ffffff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  
  /* 카테고리 관리 */
  .form {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .form input {
    width: 240px;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
  }
  
  .form button {
    height: 38px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 16px;
    font-weight: bold;
  }
  
  .form button:hover {
    background-color: #0056b3;
  }
  
  /* 카테고리 카드 */
  .category-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .category-card {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .category-name {
    width: 240px;
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  
  .card-buttons {
    display: flex;
    gap: 6px;
  }
  
  .card-buttons button {
    height: 34px;
    padding: 0 12px;
    background: #17a2b8;
    color: white;
    font-size: 13px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
  }
  
  .card-buttons button:hover {
    background: #138496;
  }
  
  .count {
    font-size: 13px;
    color: #555;
    margin-top: 8px;
  }
  
  /* 접힌 상태 소분류 요약 */
  .subcategory-summary {
    font-size: 13px;
    color: #666;
    margin-top: 10px;
  }
  
  /* 소분류 펼침 */
  .sub-form {
    display: flex;
    gap: 8px;
    margin: 15px 0;
  }
  
  .sub-form input {
    width: 200px;
    padding: 6px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  
  .sub-form button {
    height: 34px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 16px;
    font-size: 14px;
    font-weight: bold;
  }
  
  .sub-form button:hover {
    background: #218838;
  }
  
  /* 소분류 리스트 */
  .subcategory-item {
    background: #f0f2f5;
    padding: 8px 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
  }
  
  .subcategory-name {
    flex: 1;
    padding: 6px 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  
  .sub-buttons {
    display: flex;
    gap: 6px;
  }
  
  .sub-buttons button {
    height: 30px;
    padding: 0 10px;
    background: #6c757d;
    color: white;
    font-size: 13px;
    border: none;
    border-radius: 8px;
  }
  
  .sub-buttons button:hover {
    background: #5a6268;
  }
  
  .sub-count {
    font-size: 12px;
    color: #777;
    margin-left: auto;
  }
  
  /* 최근 등록 상품 */
  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .card {
    background: #f0f0f0;
    padding: 10px;
    border-radius: 10px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex: 1 1 220px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  
  .thumbnail {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .card-info {
    display: flex;
    flex-direction: column;
  }
  
  .card-title {
    font-weight: bold;
    font-size: 16px;
  }
  
  .card-sub {
    font-size: 13px;
    color: #888;
  }
  
  /* 반응형 */
  @media (max-width: 768px) {
    .two-column {
      flex-direction: column;
    }
  }
  </style>
  
  
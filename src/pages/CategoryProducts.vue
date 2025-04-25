<template>
    <div class="container">
      <!-- 상단 고정 카테고리명 -->
      <div class="category-header">
        현재 카테고리: <span>{{ categoryName }}</span>
      </div>
  
      <!-- 상품 목록 -->
      <div v-if="paginatedProducts.length" class="grid">
        <div
          v-for="product in paginatedProducts"
          :key="product.id"
          class="card"
          @click="goToDetail(product.id)"
        >
          <img :src="product.image_url" :alt="product.name" />
          <div class="card-body">
            {{ product.name }}<br />
            {{ product.price }}원
          </div>
        </div>
      </div>
  
      <!-- 상품이 없을 경우 -->
      <div v-else class="empty-message">
        등록된 상품이 없습니다.
      </div>
  
      <!-- 페이지네이션 -->
      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1">이전</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page === totalPages">다음</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { supabase } from '@/supabase'
  
  const router = useRouter()
  const route = useRoute()
  
  const categoryId = ref(route.params.categoryId)
  const categoryName = ref('')
  const products = ref([])
  const page = ref(1)
  const perPage = 12
  
  const totalPages = computed(() =>
    Math.ceil(products.value.length / perPage)
  )
  
  const paginatedProducts = computed(() => {
    const start = (page.value - 1) * perPage
    return products.value.slice(start, start + perPage)
  })
  
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', parseInt(categoryId.value))
  
    if (data) products.value = data
    if (error) console.error(error)
  }
  
  const fetchCategoryName = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('id', parseInt(categoryId.value))
      .single()
  
    if (data) categoryName.value = data.name
  }
  
  const goToDetail = (id) => {
    router.push(`/product/${id}`)
  }
  
  const prevPage = () => {
    if (page.value > 1) page.value--
  }
  const nextPage = () => {
    if (page.value < totalPages.value) page.value++
  }
  
  watch(() => route.params.categoryId, async newVal => {
    categoryId.value = newVal
    page.value = 1
    await fetchCategoryName()
    await fetchProducts()
  })
  
  onMounted(async () => {
    await fetchCategoryName()
    await fetchProducts()
  })
  </script>
  
  <style scoped>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
  }
  
  /* 고정 카테고리명 */
  .category-header {
    position: sticky;
    top: 80px;
    z-index: 10;
    background-color: white;
    padding: 12px 8px;
    font-size: 16px;
    font-weight: bold;
    color: #a67c00;
    text-align: center;
    border-bottom: 1px solid #ddd;
  }
  .category-header span {
    color: #333;
    font-weight: normal;
  }
  
  /* 상품 그리드 */
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 24px;
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
  
  /* 상품 카드 */
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
  
  /* 상품 없음 메시지 */
  .empty-message {
    margin: 40px 0;
    padding: 20px;
    color: #777;
    background: #f4f4f4;
    border-radius: 6px;
    text-align: center;
    font-size: 15px;
  }
  
  /* 페이지네이션 */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 32px;
  }
  .pagination button {
    padding: 8px 16px;
    border-radius: 6px;
    background-color: #ccc;
    border: none;
    cursor: pointer;
  }
  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  </style>
  
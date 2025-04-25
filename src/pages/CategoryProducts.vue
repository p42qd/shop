<template>
  <div class="container">
    <!-- 상단 카테고리명 -->
    <div class="category-header">
      <h1>{{ categoryName }}</h1>
    </div>

    <!-- 상품 목록 -->
    <div v-if="paginatedProducts.length" class="product-grid">
      <div
        v-for="product in paginatedProducts"
        :key="product.id"
        class="card"
        @click="goToDetail(product.id)"
      >
        <img :src="product.image_url" :alt="product.name" class="product-image" />
        <div class="card-body">
          <div class="product-name">{{ product.name }}</div>
          <!-- <div class="product-price">{{ product.price.toLocaleString() }}원</div> -->
        </div>
      </div>
    </div>

    <!-- 상품 없음 -->
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
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabase'

const router = useRouter()
const route = useRoute()

const categoryId = ref(route.params.categoryId)
const categoryName = ref('')
const products = ref([])
const page = ref(1)
const perPage = ref(getPerPage())  // 반응형으로 perPage 계산

function getPerPage() {
  return window.innerWidth < 768 ? 8 : 12
}

function handleResize() {
  perPage.value = getPerPage()
}

const totalPages = computed(() =>
  Math.ceil(products.value.length / perPage.value)
)

const paginatedProducts = computed(() => {
  const start = (page.value - 1) * perPage.value
  return products.value.slice(start, start + perPage.value)
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
  if (page.value > 1) {
    page.value--
    window.scrollTo({ top: 0})
  }
}
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    window.scrollTo({ top: 0})
  }
}

watch(() => route.params.categoryId, async newVal => {
  categoryId.value = newVal
  page.value = 1
  await fetchCategoryName()
  await fetchProducts()
})

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await fetchCategoryName()
  await fetchProducts()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* 카테고리 제목 */
.category-header {
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 12px;
  margin-bottom: 24px;
}
.category-header h1 {
  font-size: 22px;
  font-weight: bold;
  color: #a67c00;
}

/* 상품 그리드 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 카드 */
.card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.product-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}
.card-body {
  padding: 12px;
  text-align: center;
}
.product-name {
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}
.product-price {
  font-size: 15px;
  font-weight: bold;
  color: #b0934d;
}

/* 상품 없음 */
.empty-message {
  padding: 40px;
  text-align: center;
  color: #777;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 15px;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 36px;
}
.pagination button {
  background-color: #a67c00;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>

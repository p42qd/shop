<template>
  <div class="container">
    <div class="layout">
      <CategorySidebar v-if="isPc" />

      <main class="main">
        <div class="category-header">
          <h1>
            {{ categoryName }}
            <span v-if="subcategoryName"> / {{ subcategoryName }}</span>
          </h1>
        </div>

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
            </div>
          </div>
        </div>

        <div v-else class="empty-message">등록된 상품이 없습니다.</div>

        <div class="pagination">
          <button @click="jumpBackward" :disabled="page === 1">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M11 6l-6 6 6 6M18 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button @click="prevPage" :disabled="page === 1">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            v-for="p in pageNumbers"
            :key="p"
            :class="{ active: page === p }"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
          <button @click="nextPage" :disabled="page === totalPages">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button @click="jumpForward" :disabled="page === totalPages">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M6 6l6 6-6 6M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import CategorySidebar from '@/components/CategorySidebar.vue'

const router = useRouter()
const route = useRoute()

const categoryId = ref(route.params.categoryId)
const subcategoryId = ref(route.query.sub_id || null)

const categoryName = ref('')
const subcategoryName = ref('')
const products = ref([])
const page = ref(1)
const perPage = ref(getPerPage())
const isPc = ref(window.innerWidth >= 768)

function getPerPage() {
  return window.innerWidth < 768 ? 20 : 40
}

function handleResize() {
  perPage.value = getPerPage()
  isPc.value = window.innerWidth >= 768
}

const totalPages = computed(() =>
  Math.ceil(products.value.length / perPage.value)
)

const paginatedProducts = computed(() => {
  const start = (page.value - 1) * perPage.value
  return products.value.slice(start, start + perPage.value)
})

const fetchProducts = async () => {
  let query = supabase.from('products').select('*')

  if (subcategoryId.value) {
    query = query.eq('sub_id', parseInt(subcategoryId.value)) // 컬럼명 'sub_id' 주의
  } else {
    query = query.eq('category_id', parseInt(categoryId.value))
  }

  const { data, error } = await query

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
  if (error) console.error(error)
}

const fetchSubcategoryName = async () => {
  if (!subcategoryId.value) {
    subcategoryName.value = ''
    return
  }

  const { data, error } = await supabase
    .from('subcategories')
    .select('name')
    .eq('id', parseInt(subcategoryId.value))
    .single()

  if (data) subcategoryName.value = data.name
  if (error) {
    subcategoryName.value = ''
    console.error(error)
  }
}

const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    window.scrollTo({ top: 0 })
  }
}
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    window.scrollTo({ top: 0 })
  }
}
const goToPage = (p) => {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    window.scrollTo({ top: 0 })
  }
}
const jumpBackward = () => {
  page.value = Math.max(1, page.value - 5)
  window.scrollTo({ top: 0 })
}
const jumpForward = () => {
  page.value = Math.min(totalPages.value, page.value + 5)
  window.scrollTo({ top: 0 })
}

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = page.value
  const maxVisible = 5

  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = Math.max(1, end - maxVisible + 1)
  }

  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

watch(
  [() => route.params.categoryId, () => route.query.sub_id],
  async ([newCategoryId, newSubId]) => {
    categoryId.value = newCategoryId
    subcategoryId.value = newSubId || null
    page.value = 1
    await fetchCategoryName()
    await fetchSubcategoryName()
    await fetchProducts()
  }
)

onMounted(async () => {
  window.addEventListener('resize', handleResize)

  categoryId.value = route.params.categoryId
  subcategoryId.value = route.query.sub_id || null

  await fetchCategoryName()
  await fetchSubcategoryName()
  await fetchProducts()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
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
    grid-template-columns: repeat(8, 1fr);
  }
}
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
.empty-message {
  padding: 40px;
  text-align: center;
  color: #777;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 15px;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 36px;
  flex-wrap: wrap;
}
.pagination button {
  background-color: #f0f0f0;
  color: #555;
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.pagination button:hover {
  background-color: #e0e0e0;
}
.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.pagination button.active {
  background-color: #b0934d;
  color: white;
  font-weight: 700;
  border: 1px solid #b0934d;
}
.icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}
</style>

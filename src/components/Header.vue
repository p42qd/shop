<template>
  <header class="header">
    <div v-if="!route.path.startsWith('/desk-control')" class="title" @click="goToMain()">
      <img src="../assets/icnos/hamao_logo.png" alt="이미지" class="hamao-logo" />
      <img src="../assets/icnos/hamao_text.png" alt="HAMAO" class="hamao-text" />
    </div>

    <!-- admin일 때 보이는 로고 -->
    <div v-else class="admin-title" @click="goToAdmin()">
      <img src="../assets/icnos/hamao_logo.png" alt="이미지" class="hamao-admin-logo" />
      <img src="../assets/icnos/hamao_admin.png" alt="HAMAO" class="hamao-admin-text" />
    </div>

    <div class="hamburger">
      <span class="material-symbols-outlined" @click="toggleMenu()">menu</span>
    </div>

    <form class="search-form" v-if="!route.path.startsWith('/desk-control')" @submit.prevent="onSearch">
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

  <!-- 모바일 메뉴 -->
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
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const route = useRoute()

const search = ref('')
const selectedCategoryId = ref(null)
const selectedSubId = ref(null)
const categoryMap = ref({})
const mobileMenuToggle = ref(false)

function toggleMenu() {
  mobileMenuToggle.value = !mobileMenuToggle.value
}

function toggleCategory(id) {
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = null
    selectedSubId.value = null
    // mobileMenuToggle.value = false
  } else {
    selectedCategoryId.value = id
    selectedSubId.value = null
    const category = Object.values(categoryMap.value).find(cat => cat.id === id)
    if (!category?.subs?.length) {
      mobileMenuToggle.value = false
      router.push(`/category/${id}`)
    }
  }
}

function toggleSubCategory(id) {
  selectedSubId.value = selectedSubId.value === id ? null : id
  mobileMenuToggle.value = false
  router.push(`/category/${selectedCategoryId.value}?sub_id=${id}`)
}

function goToMain() {
  window.location.href = '/'
}
function goToAdmin() {
  window.location.href = '/desk-control'
}

function onSearch() {
  const trimmed = search.value.trim()
  if (trimmed.length < 2) {
    alert('검색어는 최소 2글자 이상 입력해야 합니다.')
    return
  }
  router.push(`/search?query=${encodeURIComponent(trimmed)}`)
}

// URL에서 categoryId, subId 세팅하는 함수
function updateSelectedFromUrl() {
  const url = new URL(window.location.href)
  const pathSegments = url.pathname.split('/')
  if (pathSegments[1] === 'category') {
    const categoryIdFromUrl = parseInt(pathSegments[2])
    const subIdFromUrl = parseInt(url.searchParams.get('sub_id'))

    if (!isNaN(categoryIdFromUrl)) {
      selectedCategoryId.value = categoryIdFromUrl
    } else {
      selectedCategoryId.value = null
    }
    if (!isNaN(subIdFromUrl)) {
      selectedSubId.value = subIdFromUrl
    } else {
      selectedSubId.value = null
    }
  } else {
    selectedCategoryId.value = null
    selectedSubId.value = null
  }
}

onMounted(async () => {
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .select('id, name, subcategories(id, name)')
    .order('id')

  if (!catErr) {
    const map = {}
    catData.forEach(cat => {
      map[cat.name] = {
        id: cat.id,
        subs: cat.subcategories || [],
      }
    })
    categoryMap.value = map
  }

  // ✅ 최초 페이지 로딩 시 URL에서 세팅
  updateSelectedFromUrl()
})

// ✅ 라우트 이동 시도 URL 반영
watch(
  () => route.fullPath,
  () => {
    updateSelectedFromUrl()
  },
  { immediate: true }
)
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
  z-index: 10;
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
  .header .admin-title {
    width: 310px !important;
  }

  .hamao-admin-logo {
    width: 35px;
    height: 35px;
  }

  .hamao-admin-text {
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

.admin-title {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin: 15px 0;
}

.hamao-admin-logo {
  width: 35px;
  height: 35px;
}

.hamao-admin-text {
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

/* 📱 모바일 메뉴 */
.mobile-menu {
  position: fixed;
  width: 100%;
  top: 145px;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9;
}

.mobile-sidebar {
  width: 70%;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 0 0 8px 8px;
  padding: 12px;

  /* ✅ 추가: 스크롤 가능하게 처리 */
  height: 100vh;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
   /* ✅ 스크롤바 숨기기 */
   scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.mobile-sidebar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

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

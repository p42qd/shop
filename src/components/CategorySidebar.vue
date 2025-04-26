<template>
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
  </template>
  
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

const router = useRouter();
const selectedCategoryId = ref(null);
const selectedSubId = ref(null);
const categoryMap = ref({});

function toggleCategory(id) {
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = null;
    selectedSubId.value = null;
  } else {
    selectedCategoryId.value = id;
    selectedSubId.value = null;
    const category = Object.values(categoryMap.value).find(cat => cat.id === id);
    if (!category?.subs?.length) {
      router.push(`/category/${id}`);
    }
  }
}

function toggleSubCategory(id) {
  selectedSubId.value = selectedSubId.value === id ? null : id;
  router.push(`/category/${selectedCategoryId.value}?sub_id=${id}`);
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

    // ✅ URL에서 현재 categoryId, subId 읽어오기
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/'); // ex) ['', 'category', '13']
    if (pathSegments[1] === 'category') {
      const categoryId = parseInt(pathSegments[2]);
      const subId = parseInt(url.searchParams.get('sub_id'));

      if (!isNaN(categoryId)) {
        selectedCategoryId.value = categoryId;
      }
      if (!isNaN(subId)) {
        selectedSubId.value = subId;
      }
    }
  }
});


</script>
  
  <style scoped>
  .sidebar {
    width: 220px;
    background-color: #ffffff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    display: none;
  }
  @media (min-width: 768px) {
    .sidebar {
      display: block;
    }
  }
  
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
  .subcategory {
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
  }
  .category:hover {
    background-color: #f9fafb;
  }
  .subcategory:hover {
    background-color: #e9ecef;
  }
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
  </style>
  
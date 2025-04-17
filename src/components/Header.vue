<template>
    <header class="header">
      <div class="title" @click="goToMain()">
        <img src="../assets/icnos/hamao_logo.png" alt="이미지" class="hamao-logo" />
        <img src="../assets/icnos/hamao_text.png" alt="HAMAO" class="hamao-text" />
      </div>
      <div class="hamburger">
        <span class="material-symbols-outlined" v-if="route.path === '/'" @click="menuOpen = !menuOpen">menu</span>
      </div>
      <form class="search-form">
        <input
          class="search"
          type="text"
          v-model="search"
          placeholder="검색어를 입력하세요"
        />
        <button type="submit">
          <span class="material-symbols-outlined">search</span>
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
  </template>
  
<script setup>
    import { ref, onMounted } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { supabase } from '../supabase';

    const router = useRouter(); 
    const route = useRoute(); 
    const search = ref('');
    const menuOpen = ref(false)
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
        }
    }

    function toggleSubCategory(id) {
        menuOpen.value = false
        selectedSubId.value = selectedSubId.value === id ? null : id;
    }

    function goToMain(id) {
        router.push(`/`);
    }

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
    });
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
  .header .title {
    width: 200px !important;
  }
  .hamao-logo {
    width: 35px;
    height: 35px;
  }

  .hamao-text {
    height: 35px;;
  }
  .mobile-sidebar {
    display: none
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
  height: 35px;;
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
.mobile-sidebar {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 0px 0px 8px 8px;
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
</style>
  
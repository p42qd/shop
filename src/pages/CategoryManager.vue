<template>
    <div class="container">
      <h1>카테고리 + 소분류 관리</h1>
  
      <form @submit.prevent="addCategory" class="form">
        <input v-model="newCategoryName" placeholder="새 카테고리 이름" />
        <button type="submit">카테고리 추가</button>
      </form>
  
      <ul class="category-list">
        <li v-for="cat in categories" :key="cat.id" class="category-item">
          <div class="category-header">
            <input v-model="cat.name" />
            <button @click="updateCategory(cat)">수정</button>
            <button @click="deleteCategory(cat.id)">삭제</button>
            <span class="category-count">상품 수: {{ cat.product_count }}</span>
          </div>
  
          <!-- 소분류 입력창 -->
          <form @submit.prevent="addSubcategory(cat.id, cat.newSubName)" class="sub-form">
            <input v-model="cat.newSubName" placeholder="소분류 추가" />
            <button type="submit">+</button>
          </form>
  
          <!-- 소분류 목록 -->
          <ul class="subcategory-list">
            <li v-for="sub in cat.subcategories" :key="sub.id" class="subcategory-item">
              <div class="subcategory-header">
                <input v-model="sub.name" />
                <button @click="updateSubcategory(sub)">수정</button>
                <button @click="deleteSubcategory(sub.id, cat.id)">삭제</button>
                <span class="subcategory-count">상품 수: {{ sub.product_count }}</span>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { supabase } from '../supabase';
  
  const categories = ref([]);
  const newCategoryName = ref('');
  
  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, subcategories(id, name)')
      .order('id');
  
    if (error) {
      console.error('불러오기 실패:', error.message);
    } else {
      const categoriesWithProductCount = await Promise.all(
        data.map(async (cat) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('category_id', cat.id);
  
          const subcategoriesWithProductCount = await Promise.all(
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
            subcategories: subcategoriesWithProductCount,
            newSubName: '',
          };
        })
      );
  
      categories.value = categoriesWithProductCount;
    }
  }
  
  async function addCategory() {
    if (!newCategoryName.value.trim()) return;
  
    const { error } = await supabase.from('categories').insert({ name: newCategoryName.value });
  
    if (error) {
      console.error('추가 실패:', error.message);
    } else {
      newCategoryName.value = '';
      fetchCategories();
    }
  }
  
  async function updateCategory(cat) {
    const { error } = await supabase.from('categories').update({ name: cat.name }).eq('id', cat.id);
  
    if (error) {
      console.error('수정 실패:', error.message);
    }
  }
  
  async function deleteCategory(id) {
    if (confirm('정말 삭제하시겠습니까? 이 카테고리의 상품들도 삭제됩니다.')) {
      // 카테고리에 속한 상품 삭제
      const { error: deleteProductsError } = await supabase
        .from('products')
        .delete()
        .eq('category_id', id);
  
      if (deleteProductsError) {
        console.error('상품 삭제 실패:', deleteProductsError.message);
        return;
      }
  
      // 카테고리 삭제
      const { error } = await supabase.from('categories').delete().eq('id', id);
  
      if (error) {
        console.error('삭제 실패:', error.message);
      } else {
        fetchCategories();
      }
    }
  }
  
  async function addSubcategory(category_id, name) {
    if (!name.trim()) return;
  
    const { error } = await supabase.from('subcategories').insert({ name, category_id });
  
    if (error) {
      console.error('소분류 추가 실패:', error.message);
    } else {
      fetchCategories();
    }
  }
  
  async function updateSubcategory(sub) {
    const { error } = await supabase.from('subcategories').update({ name: sub.name }).eq('id', sub.id);
  
    if (error) {
      console.error('소분류 수정 실패:', error.message);
    }
  }
  
  async function deleteSubcategory(id, category_id) {
    if (confirm('소분류를 삭제하시겠습니까? 이 소분류의 상품들도 삭제됩니다.')) {
      // 소분류에 속한 상품 삭제
      const { error: deleteSubProductsError } = await supabase
        .from('products')
        .delete()
        .eq('sub_id', id);
  
      if (deleteSubProductsError) {
        console.error('소분류 상품 삭제 실패:', deleteSubProductsError.message);
        return;
      }
  
      // 소분류 삭제
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
  
      if (error) {
        console.error('소분류 삭제 실패:', error.message);
      } else {
        fetchCategories();
      }
    }
  }
  
  onMounted(fetchCategories);
  </script>
  
  <style scoped>
  .container {
    max-width: 700px;
    margin: auto;
    padding: 24px;
  }
  
  h1 {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 16px;
  }
  
  .form {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .form input {
    flex: 1;
    padding: 6px;
  }
  
  .category-list {
    list-style: none;
    padding: 0;
  }
  
  .category-item {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .category-header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .sub-form {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }
  
  .subcategory-list {
    list-style: none;
    padding-left: 10px;
  }
  
  .subcategory-item {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }
  
  input {
    padding: 4px 8px;
    font-size: 14px;
  }
  
  button {
    padding: 4px 8px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .category-count,
  .subcategory-count {
    margin-left: auto;
    font-size: 14px;
    color: #555;
  }
  </style>
  
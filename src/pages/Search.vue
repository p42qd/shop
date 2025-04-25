<template>
    <div class="container">
      <h2 class="title">검색 결과: "{{ query }}"</h2>
  
      <div v-if="products.length" class="grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="card"
          @click="goToDetail(product.id)"
        >
          <img :src="product.image_url" :alt="product.name" />
          <div class="card-body">
            {{ product.name }}<br />
          </div>
        </div>
      </div>
  
      <div v-else class="empty-message">
        <p>검색 결과가 없습니다.</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { supabase } from '../supabase';
  
  const route = useRoute();
  const router = useRouter();
  const query = ref(route.query.query || '');
  const products = ref([]);
  
  function goToDetail(id) {
    router.push(`/product/${id}`);
  }
  
  async function fetchProducts(keyword) {
    if (!keyword || keyword.length < 2) {
      products.value = [];
      return;
    }
  
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${keyword}%`);
  
    if (!error) {
      products.value = data;
    }
  }
  
  onMounted(() => {
    fetchProducts(query.value);
  });
  
  watch(() => route.query.query, (newVal) => {
    query.value = newVal;
    fetchProducts(newVal);
  });
  </script>
  
  <style scoped>
  .container {
    padding: 20px;
  }
  .title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #444;
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
  .empty-message {
    padding: 20px;
    color: #888;
    background: #f4f4f4;
    text-align: center;
    border-radius: 6px;
    font-size: 14px;
  }
  </style>
  
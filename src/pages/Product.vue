<template>
  <div class="container" v-if="product">
    <div class="product-box">
      <!-- 이미지 영역 -->
      <div class="image-section">
        <div class="image-wrapper">
          <!-- 모바일용 상품명 (이미지 위 고정) -->
          <div class="image-title">{{ product.name }}</div>
          <img :src="mainImage" alt="대표 이미지" class="main-image" />
        </div>

        <!-- 서브 이미지 썸네일 -->
        <div class="thumbnails" v-if="subImages.length">
          <img
            v-for="(img, i) in subImages"
            :key="i"
            :src="img.image_url"
            @click="mainImage = img.image_url"
            :class="{ selected: mainImage === img.image_url }"
          />
        </div>
      </div>

      <!-- 정보 영역 -->
      <div class="info-section">
        <h1>{{ product.name }}</h1>
        <p class="price">{{ formatPrice(product.price) }}원</p>
        <p class="description">{{ product.description }}</p>
      </div>
    </div>
  </div>

  <div v-else class="container">
    <p>상품을 불러오는 중입니다...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../supabase';

const route = useRoute();
const productId = route.params.id;

const product = ref(null);
const subImages = ref([]);
const mainImage = ref('');

function formatPrice(price) {
  return Number(price).toLocaleString();
}

onMounted(async () => {
  const { data: prod, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (prodErr) {
    console.error('상품 조회 오류:', prodErr.message);
    return;
  }

  product.value = prod;

  const { data: images, error: imgErr } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (imgErr) {
    console.error('이미지 불러오기 오류:', imgErr.message);
    return;
  }

  subImages.value = images;
  mainImage.value = images.length ? images[0].image_url : 'https://via.placeholder.com/500x400?text=No+Image';
});
</script>

<style scoped>
.container {
  max-width: 1024px;
  margin: auto;
  padding: 24px;
  font-family: system-ui, sans-serif;
}

.product-box {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 24px;
}

.image-section {
  flex: 1 1 400px;
  text-align: center;
}

.image-wrapper {
  width: 100%;
}

.image-title {
  display: none;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #222;
}

.main-image {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.thumbnails {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.thumbnails img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
}

.thumbnails img.selected {
  border-color: #007bff;
}

.info-section {
  flex: 1 1 300px;
}

.info-section h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.price {
  font-size: 20px;
  color: #e91e63;
  margin-bottom: 16px;
}

.description {
  font-size: 16px;
  color: #555;
  line-height: 1.6;
}

/* ✅ 반응형: 모바일에서 이미지 위에 상품명 (겹치지 않고 위에 고정) */
@media (max-width: 640px) {
  .image-title {
    display: block;
  }

  .info-section h1 {
    display: none;
  }
}
</style>

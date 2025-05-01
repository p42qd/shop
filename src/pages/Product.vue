<template>
  <div class="container" v-if="product">
    <div class="product-box">
      <!-- 이미지 영역 -->
      <div class="image-section">
        <div class="image-wrapper">
          <div class="image-title">{{ product.name }}</div>
          <img :src="mainImage" alt="대표 이미지" class="main-image" />
        </div>

        <!-- 서브 이미지 썸네일 -->
        <div class="thumbnails" v-if="allImages.length">
          <img
            v-for="(img, i) in allImages"
            :key="i"
            :src="img"
            @click="mainImage = img"
            :class="{ selected: mainImage === img }"
          />
        </div>
      </div>

      <!-- 정보 영역 -->
      <div class="info-section">
        <h1>{{ product.name }}</h1>
        <!-- <p class="price">{{ formatPrice(product.price) }}원</p> -->
        <p class="description">{{ product.description }}</p>
      </div>

      <div class="sub-image-list">
        <div class="sub-image-grid">
          <div
            v-for="(img, i) in allImages"
            :key="i"
            class="sub-image-wrapper"
          >
            <img :src="img" class="sub-image" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="container">
    <p>불러오는 중입니다...</p>
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
const allImages = ref([]);

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
    console.error('조회 오류:', prodErr.message);
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

  // 썸네일 + 서브 이미지 합치기
  allImages.value = [
    product.value.image_url, 
    ...images.map(img => img.image_url)
  ].filter(Boolean);

  // 메인 이미지는 항상 allImages 첫 번째로
  mainImage.value = allImages.value.length ? allImages.value[0] : 'https://via.placeholder.com/500x400?text=No+Image';
  console.log(subImages.value)
});

</script>

<style scoped>
.container {
  max-width: 1024px;
  margin: auto;
  font-family: 'Pretendard', system-ui, sans-serif;
  color: #1f1f1f;
}

.product-box {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
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
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f1f1f;
}

.main-image {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
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
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s;
}

.thumbnails img.selected {
  border-color: #b0934d;
}

.info-section {
  flex: 1 1 300px;
}

.info-section h1 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.3;
  color: #222;
}

.price {
  font-size: 20px;
  color: #b0934d;
  margin-bottom: 16px;
}

.description {
  font-size: 16px;
  color: #555;
  line-height: 1.7;
  white-space: pre-wrap;
}

.sub-image-list {
  width: 100%;
  margin-top: 32px;
}

.sub-image-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
}
@media (min-width: 768px) {
  .sub-image-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.sub-image-wrapper {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.sub-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .image-title {
    display: block;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  .info-section h1 {
    display: none;
  }
}
</style>

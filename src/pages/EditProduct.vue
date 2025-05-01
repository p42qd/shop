<template>
  <div class="edit-wrapper">
    <h2>상품 수정</h2>
    <div class="edit-container">
      <!-- 왼쪽: 입력 영역 -->
      <div class="form-left">
        <div class="form-group">
          <label>상품명</label>
          <input v-model="product.name" />
        </div>
        <div class="form-group">
          <label>가격</label>
          <input v-model="product.price" type="number" />
        </div>
        <div class="form-group">
          <label>설명</label>
          <textarea v-model="product.description"></textarea>
        </div>
        <div class="form-group">
          <label>카테고리</label>
          <select v-model="product.category_id">
            <option v-for="cat in categories" :value="cat.id" :key="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>소분류</label>
          <select v-model="product.subcategory_id">
            <option v-for="sub in subcategories" :value="sub.id" :key="sub.id">{{ sub.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>메인 이미지 URL</label>
          <input v-model="product.image_url" />
        </div>
        <div class="form-group">
          <label>서브 이미지 추가</label>
          <input v-model="newSubImage" placeholder="서브 이미지 URL" />
          <button @click="addSubImage">추가</button>
        </div>
        <button class="submit-btn" @click="updateProduct">수정 완료</button>
      </div>

      <!-- 오른쪽: 미리보기 영역 -->
      <div class="form-right">
        <h4>메인 이미지 미리보기</h4>
        <img v-if="product.image_url" :src="product.image_url" class="preview-main" alt="메인 이미지" />

        <h4>서브 이미지</h4>
        <div class="sub-image-list">
          <div v-for="(url, idx) in product.sub_images" :key="idx" class="sub-image-item">
            <img :src="url" class="thumbnail" />
            <button @click="removeSubImage(idx)">삭제</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../supabase';

const route = useRoute();
const router = useRouter();

const product = reactive({
  name: '',
  price: 0,
  description: '',
  category_id: null,
  subcategory_id: null,
  image_url: '',
  sub_images: []
});

const newSubImage = ref('');
const categories = ref([]);
const subcategories = ref([]);

onMounted(async () => {
  const { data: p } = await supabase
    .from('products')
    .select('*')
    .eq('id', route.params.id)
    .single();
  if (p) Object.assign(product, p);

  const { data: subImgs } = await supabase
    .from('product_sub_images')
    .select('url')
    .eq('product_id', route.params.id);
  product.sub_images = subImgs ? subImgs.map(img => img.url) : [];

  const { data: cats } = await supabase.from('categories').select('*');
  categories.value = cats || [];

  const { data: subs } = await supabase.from('subcategories').select('*');
  subcategories.value = subs || [];
});

const addSubImage = () => {
  if (newSubImage.value) {
    product.sub_images.push(newSubImage.value);
    newSubImage.value = '';
  }
};

const removeSubImage = (idx) => {
  product.sub_images.splice(idx, 1);
};

const updateProduct = async () => {
  await supabase
    .from('products')
    .update({
      name: product.name,
      price: product.price,
      description: product.description,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id,
      image_url: product.image_url
    })
    .eq('id', route.params.id);

  await supabase.from('product_sub_images').delete().eq('product_id', route.params.id);
  for (const url of product.sub_images) {
    await supabase.from('product_sub_images').insert({
      product_id: route.params.id,
      url
    });
  }

  router.push('/desk-control/products');
};
</script>

<style scoped>
.edit-wrapper {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: sans-serif;
}

h2 {
  margin-bottom: 1rem;
  text-align: center;
}

.edit-container {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.form-left, .form-right {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  min-height: 80px;
}

.submit-btn {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.preview-main {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border: 1px solid #eee;
  margin-bottom: 1rem;
}

.sub-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.sub-image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: 1px solid #ccc;
}

.sub-image-item button {
  margin-top: 4px;
  font-size: 12px;
}
</style>

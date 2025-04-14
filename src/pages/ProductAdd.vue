<template>
  <div class="container">
    <h1>상품 등록</h1>
    <form @submit.prevent="addProduct" class="form">
      <label for="name">상품명</label>
      <input v-model="newProduct.name" id="name" required />

      <label for="price">가격</label>
      <input v-model="newProduct.price" id="price" type="number" required />

      <label for="description">상품 설명</label>
      <textarea v-model="newProduct.description" id="description" required></textarea>

      <label for="category">카테고리</label>
      <select v-model="newProduct.category_id" id="category" required>
        <option v-for="(cat, catName) in categoryMap" :key="cat.id" :value="cat.id">{{ catName }}</option>
      </select>

      <label for="subcategory">소분류</label>
      <select v-model="newProduct.sub_id" id="subcategory" required>
        <option v-for="sub in selectedCategory?.subcategories || []" :key="sub.id" :value="sub.id">
          {{ sub.name }}
        </option>
      </select>

      <label for="mainImage">메인 이미지 업로드</label>
      <input
        type="file"
        id="mainImage"
        ref="mainInputRef"
        @change="onMainImageChange"
        accept="image/*"
        required
      />

      <label for="subImages">서브 이미지 업로드 (최대 10개)</label>
      <input
        type="file"
        id="subImages"
        ref="subInputRef"
        @change="onSubImageChange"
        multiple
        accept="image/*"
      />

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '등록 중...' : '상품 등록' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { supabase } from '../supabase';

const newProduct = ref({
  name: '',
  price: '',
  description: '',
  category_id: null,
  sub_id: null,
});

const mainImageFile = ref(null);
const subImageFiles = ref([]);
const mainInputRef = ref(null);
const subInputRef = ref(null);
const categories = ref([]);
const selectedCategory = ref(null);
const categoryMap = ref({});
const isLoading = ref(false);

const onMainImageChange = (e) => {
  if (e.target?.files?.[0]) {
    mainImageFile.value = e.target.files[0];
  }
};

const onSubImageChange = (e) => {
  if (e.target?.files?.length) {
    subImageFiles.value = Array.from(e.target.files).slice(0, 10);
  }
};

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, subcategories(id, name)')
    .order('id');

  if (!error) {
    categories.value = data;
    categories.value.forEach((cat) => {
      categoryMap.value[cat.name] = cat;
    });
  } else {
    console.error('카테고리 불러오기 실패:', error.message);
  }
};

watch(
  () => newProduct.value.category_id,
  (newCategoryId) => {
    selectedCategory.value = Object.values(categoryMap.value).find((cat) => cat.id === newCategoryId);
  }
);

onMounted(() => {
  fetchCategories();
});

const uploadImage = async (file, path) => {
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) throw new Error('이미지 업로드 실패: ' + error.message);
  return path;
};

const getImageUrl = (path) => {
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data?.publicUrl || '';
};

const resetForm = () => {
  newProduct.value = {
    name: '',
    price: '',
    description: '',
    category_id: null,
    sub_id: null,
  };
  mainImageFile.value = null;
  subImageFiles.value = [];
  if (mainInputRef.value) mainInputRef.value.value = '';
  if (subInputRef.value) subInputRef.value.value = '';
};

const addProduct = async () => {
  try {
    isLoading.value = true;

    if (!mainImageFile.value) {
      alert('메인 이미지를 선택해주세요.');
      return;
    }

    const mainPath = `products/main-${Date.now()}-${mainImageFile.value.name}`;
    const savedMainPath = await uploadImage(mainImageFile.value, mainPath);
    const mainImageUrl = getImageUrl(savedMainPath);

    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([{
        name: newProduct.value.name,
        price: newProduct.value.price,
        description: newProduct.value.description,
        image_url: mainImageUrl,
        category_id: newProduct.value.category_id,
        sub_id: newProduct.value.sub_id,
      }])
      .select()
      .single();

    if (productError || !productData) {
      alert('상품 등록 실패: ' + (productError?.message || '데이터 없음'));
      console.error('상품 등록 실패:', productError?.message);
      return;
    }

    for (let i = 0; i < subImageFiles.value.length; i++) {
      const file = subImageFiles.value[i];
      const path = `products/sub-${Date.now()}-${i}-${file.name}`;
      const savedPath = await uploadImage(file, path);
      const imageUrl = getImageUrl(savedPath);

      const { error: insertError } = await supabase.from('product_images').insert([{
        product_id: productData.id,
        image_url: imageUrl,
        sort_order: i,
      }]);

      if (insertError) {
        console.error(`서브 이미지 ${i} 등록 실패:`, insertError.message);
      }
    }

    alert('상품이 성공적으로 등록되었습니다.');
    resetForm();
  } catch (err) {
    alert('오류 발생: ' + err.message);
    console.error('오류 상세:', err);
  } finally {
    isLoading.value = false;
  }
};
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
  flex-direction: column;
  gap: 16px;
}
.form label {
  font-size: 16px;
  font-weight: bold;
}
.form input,
.form select,
.form textarea {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
button {
  padding: 10px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
button:disabled {
  background-color: #888;
  cursor: not-allowed;
}
</style>

<template>
  <div class="container">
    <h1>상품 등록</h1>
    <form @submit.prevent="addProduct" class="form">
      <label for="name">상품명</label>
      <input v-model="newProduct.name" id="name" required />

      <label for="price">가격</label>
      <input v-model="newProduct.price" id="price" type="number" />

      <label for="description">상품 설명</label>
      <textarea v-model="newProduct.description" id="description"></textarea>

      <label for="category">카테고리</label>
      <select v-model="newProduct.category_id" id="category" required>
        <option v-for="(cat, catName) in categoryMap" :key="cat.id" :value="cat.id">{{ catName }}</option>
      </select>

      <label for="subcategory">소분류</label>
      <select v-model="newProduct.sub_id" id="subcategory">
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

    <!-- 실패한 이미지 재업로드 영역 -->
    <div v-if="failedMainImage || failedSubImages.length" class="retry-section">
      <h2>업로드 실패한 이미지가 있습니다.</h2>

      <div v-if="failedMainImage">
        <p>메인 이미지 업로드 실패 ({{ failedMainImage.retryCount }}/3회)</p>
        <button @click="retryMainImageUpload" :disabled="failedMainImage.retryCount >= 3">
          메인 이미지 다시 업로드
        </button>
      </div>

      <div v-if="failedSubImages.length">
        <p>서브 이미지 업로드 실패 ({{ failedSubImages.length }}개)</p>
        <button @click="retrySubImagesUpload" :disabled="failedSubImages.every(item => item.retryCount >= 3)">
          서브 이미지 다시 업로드
        </button>
      </div>
    </div>
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

// 실패한 이미지 관리
const failedMainImage = ref(null); // { file, retryCount }
const failedSubImages = ref([]);   // [{ file, index, retryCount }]
const productId = ref(null);

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
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    upsert: true,
  });
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

    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert([{
        name: newProduct.value.name,
        price: newProduct.value.price ? Number(newProduct.value.price) : null,
        description: newProduct.value.description || null,
        category_id: newProduct.value.category_id,
        sub_id: newProduct.value.sub_id || null,
      }])
      .select()
      .single();

    if (insertError || !insertedProduct) {
      alert('상품 등록 실패: ' + (insertError?.message || '데이터 없음'));
      console.error('상품 등록 실패:', insertError?.message);
      return;
    }

    productId.value = insertedProduct.id;

    // 메인 이미지 업로드
    try {
      const extension = mainImageFile.value.name.split('.').pop();
      const mainPath = `products/${productId.value}_main.${extension}`;
      await uploadImage(mainImageFile.value, mainPath);
      const mainImageUrl = getImageUrl(mainPath);

      await supabase.from('products').update({
        image_url: mainImageUrl,
        main_image_filename: `${productId.value}_main.${extension}`,
      }).eq('id', productId.value);
    } catch (error) {
      console.error('메인 이미지 업로드 실패:', error.message);
      failedMainImage.value = { file: mainImageFile.value, retryCount: 0 };
    }

    // 서브 이미지 업로드
    for (let i = 0; i < subImageFiles.value.length; i++) {
      const file = subImageFiles.value[i];
      const extension = file.name.split('.').pop();
      const subPath = `products/${productId.value}_sub_${i}.${extension}`;

      try {
        await uploadImage(file, subPath);
        const subImageUrl = getImageUrl(subPath);

        await supabase.from('product_images').insert([{
          product_id: productId.value,
          image_url: subImageUrl,
          image_filename: `${productId.value}_sub_${i}.${extension}`,
          sort_order: i,
        }]);
      } catch (error) {
        console.error(`서브 이미지 ${i} 업로드 실패:`, error.message);
        failedSubImages.value.push({ file, index: i, retryCount: 0 });
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

// 재업로드 함수
const retryMainImageUpload = async () => {
  if (!failedMainImage.value) return;

  if (failedMainImage.value.retryCount >= 3) {
    alert('메인 이미지는 최대 3회까지만 재시도할 수 있습니다.');
    return;
  }

  try {
    const extension = failedMainImage.value.file.name.split('.').pop();
    const mainPath = `products/${productId.value}_main.${extension}`;
    await uploadImage(failedMainImage.value.file, mainPath);
    const mainImageUrl = getImageUrl(mainPath);

    await supabase.from('products').update({
      image_url: mainImageUrl,
      main_image_filename: `${productId.value}_main.${extension}`,
    }).eq('id', productId.value);

    alert('메인 이미지 재업로드 완료');
    failedMainImage.value = null;
  } catch (error) {
    failedMainImage.value.retryCount += 1;
    alert(`메인 이미지 재업로드 실패 (${failedMainImage.value.retryCount}회 시도됨)`);
  }
};

const retrySubImagesUpload = async () => {
  const tempFailed = [];

  for (const item of failedSubImages.value) {
    if (item.retryCount >= 3) {
      tempFailed.push(item);
      continue;
    }

    try {
      const extension = item.file.name.split('.').pop();
      const subPath = `products/${productId.value}_sub_${item.index}.${extension}`;
      await uploadImage(item.file, subPath);
      const subImageUrl = getImageUrl(subPath);

      await supabase.from('product_images').insert([{
        product_id: productId.value,
        image_url: subImageUrl,
        image_filename: `${productId.value}_sub_${item.index}.${extension}`,
        sort_order: item.index,
      }]);
    } catch (error) {
      console.error(`서브 이미지 ${item.index} 재업로드 실패:`, error.message);
      tempFailed.push({ ...item, retryCount: item.retryCount + 1 });
    }
  }

  if (tempFailed.length === 0) {
    alert('서브 이미지 재업로드 완료');
    failedSubImages.value = [];
  } else {
    alert(`${tempFailed.length}개 서브 이미지가 여전히 실패했습니다.`);
    failedSubImages.value = tempFailed;
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
.retry-section {
  margin-top: 40px;
  padding: 16px;
  background-color: #ffe5e5;
  border-radius: 8px;
}
</style>

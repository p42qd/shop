<template>
  <div class="container">
    <h1>상품 등록</h1>
    <div class="layout">
      <!-- 입력 영역 -->
      <form class="form" @submit.prevent="handleSubmit">
        <div class="form-block">
          <label>상품명 *</label>
          <input v-model="form.name" required />

          <label>가격</label>
          <input type="number" v-model="form.price" />

          <label>상품 설명</label>
          <textarea v-model="form.description" rows="4" />

          <label>관리자 메모 (관리자 전용)</label>
          <textarea v-model="form.admin_note" rows="3" />

          <label>카테고리</label>
          <select v-model="form.category_id">
            <option disabled value="">선택</option>
            <option v-for="(cat, catName) in categoryMap" :key="cat.id" :value="cat.id">
              {{ catName }}
            </option>
          </select>

          <label>소분류</label>
          <select v-model="form.sub_id">
            <option disabled value="">선택</option>
            <option v-for="sub in selectedCategory?.subcategories || []" :key="sub.id" :value="sub.id">
              {{ sub.name }}
            </option>
          </select>

          <button class="submit" :disabled="isLoading">
            {{ isLoading ? '등록 중...' : '상품 등록' }}
          </button>
        </div>
      </form>

      <!-- 미리보기 + 업로드 영역 -->
      <div class="preview">
        <div class="upload-section">
          <label class="upload-label" @click="mainInputRef.click()">메인 이미지 업로드 *</label>
          <input type="file" accept="image/*" @change="onMainImageChange" ref="mainInputRef" class="hidden-input" />
        </div>

        <div v-if="mainPreviewUrl">
          <h3>메인 이미지</h3>
          <div class="image-box">
            <img :src="mainPreviewUrl" class="main-image" />
            <button class="remove-button" @click="removeMainImage">×</button>
          </div>
        </div>

        <div class="upload-section">
          <label class="upload-label" @click="subInputRef.click()">서브 이미지 업로드 (최대 10개)</label>
          <input type="file" accept="image/*" multiple @change="onSubImageChange" ref="subInputRef" class="hidden-input" />
        </div>

        <div v-if="subPreviewUrls.length">
          <h3>서브 이미지</h3>
          <div class="sub-preview">
            <div class="image-box" v-for="(url, i) in subPreviewUrls" :key="i">
              <img :src="url" class="preview-thumbnail" />
              <button class="remove-button" @click="removeSubImage(i)">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { supabase } from '../supabase';

const form = ref({
  name: '',
  price: '',
  description: '사이즈:\n색상:',
  admin_note: '',
  category_id: '',
  sub_id: ''
});

const mainImageFile = ref(null);
const mainPreviewUrl = ref(null);
const subImageFiles = ref([]);
const subPreviewUrls = ref([]);
const mainInputRef = ref(null);
const subInputRef = ref(null);
const categories = ref([]);
const selectedCategory = ref(null);
const categoryMap = ref({});
const isLoading = ref(false);
const productId = ref(null);

watch(() => form.value.category_id, (newId) => {
  selectedCategory.value = Object.values(categoryMap.value).find(cat => cat.id === newId);
});

onMounted(async () => {
  const { data, error } = await supabase.from('categories').select('id, name, subcategories(id, name)').order('id');
  if (!error) {
    categories.value = data;
    data.forEach(cat => categoryMap.value[cat.name] = cat);
  }
});

const onMainImageChange = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    mainImageFile.value = file;
    mainPreviewUrl.value = URL.createObjectURL(file);
  }
};

const onSubImageChange = (e) => {
  const files = Array.from(e.target.files).slice(0, 10);
  subImageFiles.value = files;
  subPreviewUrls.value = files.map(file => URL.createObjectURL(file));
};

const removeMainImage = () => {
  mainImageFile.value = null;
  mainPreviewUrl.value = null;
  if (mainInputRef.value) mainInputRef.value.value = '';
};

const removeSubImage = (index) => {
  subImageFiles.value.splice(index, 1);
  subPreviewUrls.value.splice(index, 1);
  if (subInputRef.value) subInputRef.value.value = '';
};

const uploadImage = async (file, path) => {
  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data?.publicUrl || '';
};

const resetForm = () => {
  form.value = {
    name: '',
    price: '',
    description: '사이즈:\n색상:',
    admin_note: '',
    category_id: '',
    sub_id: ''
  };
  mainImageFile.value = null;
  mainPreviewUrl.value = null;
  subImageFiles.value = [];
  subPreviewUrls.value = [];
  if (mainInputRef.value) mainInputRef.value.value = '';
  if (subInputRef.value) subInputRef.value.value = '';
};

const handleSubmit = async () => {
  if (!mainImageFile.value) {
    alert('메인 이미지는 필수입니다.');
    return;
  }

  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: form.value.name,
        price: form.value.price ? Number(form.value.price) : null,
        description: form.value.description,
        admin_note: form.value.admin_note || null,
        category_id: form.value.category_id || null,
        sub_id: form.value.sub_id || null
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || '상품 등록 실패');
    productId.value = data.id;

    const ext = mainImageFile.value.name.split('.').pop();
    const mainPath = `products/${productId.value}_main.${ext}`;
    const mainUrl = await uploadImage(mainImageFile.value, mainPath);

    await supabase.from('products').update({
      image_url: mainUrl,
      main_image_filename: `${productId.value}_main.${ext}`
    }).eq('id', productId.value);

    await Promise.all(subImageFiles.value.map(async (file, i) => {
      const ext = file.name.split('.').pop();
      const subPath = `products/${productId.value}_sub_${i}.${ext}`;
      const subUrl = await uploadImage(file, subPath);

      await supabase.from('product_images').insert({
        product_id: productId.value,
        image_url: subUrl,
        image_filename: `${productId.value}_sub_${i}.${ext}`,
        sort_order: i
      });
    }));

    alert('상품 등록이 완료되었습니다.');
    resetForm();
  } catch (err) {
    alert('오류: ' + err.message);
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 28px;
  margin-bottom: 32px;
  text-align: center;
}

.layout {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-block label {
  font-weight: 600;
  margin-top: 12px;
  margin-bottom: 4px;
  display: block;
}

input,
select,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}

button.submit {
  margin-top: 20px;
  padding: 12px;
  background: #007bff;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  width: 100%;
}

button.submit:hover {
  background: #0056b3;
}

.preview {
  flex: 1;
  background: #f8f8f8;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.upload-label {
  padding: 10px 16px;
  background: #007bff;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: inline-block;
}

.hidden-input {
  display: none;
}

.image-box {
  position: relative;
  margin-bottom: 16px;
}

.main-image {
  width: 200px;
  height: 200px;
  border-radius: 6px;
  border: 1px solid #ccc;
  object-fit: cover;
}

.preview-thumbnail {
  width: 90px;
  height: 90px;
  border-radius: 6px;
  border: 1px solid #ccc;
  object-fit: cover;
}

.sub-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.remove-button {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  cursor: pointer;
}
</style>
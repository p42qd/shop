<template>
    <div class="container">
      <h1>{{ isEditMode ? '상품 수정' : '상품 등록' }}</h1>
      <form @submit.prevent="handleSubmit" class="form">
        <label for="name">상품명</label>
        <input v-model="form.name" id="name" required />
  
        <label for="price">가격</label>
        <input v-model="form.price" id="price" type="number" required />
  
        <label for="description">상품 설명</label>
        <textarea v-model="form.description" id="description"></textarea>
  
        <label for="category">카테고리</label>
        <select v-model="form.category_id" id="category" required>
          <option v-for="(cat, catName) in categoryMap" :key="cat.id" :value="cat.id">{{ catName }}</option>
        </select>
  
        <label for="subcategory">소분류</label>
        <select v-model="form.sub_id" id="subcategory">
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
          :required="!isEditMode"
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
          {{ isLoading ? '처리 중...' : isEditMode ? '수정 완료' : '상품 등록' }}
        </button>
        <button type="button" @click="$emit('close')">취소</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted } from 'vue';
  import { supabase } from '../supabase';
  
  const props = defineProps({
    product: Object
  });
  const emit = defineEmits(['saved', 'close']);
  
  const isEditMode = ref(!!props.product);
  const form = ref({
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
  const productId = ref(null);
  
  watch(
    () => form.value.category_id,
    (newCategoryId) => {
      selectedCategory.value = Object.values(categoryMap.value).find(cat => cat.id === newCategoryId);
    }
  );
  
  onMounted(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, subcategories(id, name)')
      .order('id');
  
    if (!error) {
      categories.value = data;
      data.forEach(cat => categoryMap.value[cat.name] = cat);
    }
  
    if (props.product) {
      form.value = { ...props.product };
      productId.value = props.product.id;
    }
  });
  
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
  
  const uploadImage = async (file, path) => {
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data?.publicUrl || '';
  };
  
  const handleSubmit = async () => {
    isLoading.value = true;
    try {
      let id = productId.value;
      if (!isEditMode.value) {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: form.value.name,
            price: Number(form.value.price),
            description: form.value.description,
            category_id: form.value.category_id,
            sub_id: form.value.sub_id
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        id = data.id;
        productId.value = id;
      } else {
        const { error } = await supabase
          .from('products')
          .update({
            name: form.value.name,
            price: Number(form.value.price),
            description: form.value.description,
            category_id: form.value.category_id,
            sub_id: form.value.sub_id
          })
          .eq('id', id);
        if (error) throw new Error(error.message);
      }
  
      if (mainImageFile.value) {
        const ext = mainImageFile.value.name.split('.').pop();
        const path = `products/${id}_main.${ext}`;
        const url = await uploadImage(mainImageFile.value, path);
        await supabase.from('products').update({
          image_url: url,
          main_image_filename: `${id}_main.${ext}`
        }).eq('id', id);
      }
  
      for (let i = 0; i < subImageFiles.value.length; i++) {
        const file = subImageFiles.value[i];
        const ext = file.name.split('.').pop();
        const path = `products/${id}_sub_${i}.${ext}`;
        const url = await uploadImage(file, path);
        await supabase.from('product_images').insert({
          product_id: id,
          image_url: url,
          image_filename: `${id}_sub_${i}.${ext}`,
          sort_order: i
        });
      }
  
      alert(isEditMode.value ? '수정 완료되었습니다.' : '등록 완료되었습니다.');
      emit('saved');
      emit('close');
    } catch (e) {
      alert('오류: ' + e.message);
      console.error(e);
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
  
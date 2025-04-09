<template>
    <div class="container">
      <h1>상품 등록</h1>
  
      <form @submit.prevent="addProduct" class="form">
        <label for="name">상품명</label>
        <input v-model="newProduct.name" id="name" placeholder="상품명" required />
  
        <label for="price">가격</label>
        <input v-model="newProduct.price" id="price" type="number" placeholder="가격" required />
  
        <label for="description">상품 설명</label>
        <textarea v-model="newProduct.description" id="description" placeholder="상품 설명" required></textarea>
  
        <label for="category">카테고리</label>
        <select v-model="newProduct.category_id" id="category" required>
          <option v-for="(cat, catName) in categoryMap" :key="cat.id" :value="cat.id">{{ catName }}</option>
        </select>
  
        <!-- 소분류 선택 -->
        <label for="subcategory">소분류</label>
        <select v-model="newProduct.sub_id" id="subcategory" required>
          <option v-for="sub in selectedCategory?.subcategories || []" :key="sub.id" :value="sub.id">
            {{ sub.name }}
          </option>
        </select>
  
        <!-- 메인 이미지 URL 입력 -->
        <label for="imageUrl">메인 이미지 URL</label>
        <input v-model="newProduct.image_urls" id="imageUrl" placeholder="메인 이미지 URL" required />
  
        <!-- 서브 이미지 URL 입력 (공백 구분, 최대 10개) -->
        <label for="subImageUrls">서브 이미지 URLs (최대 10개)</label>
        <textarea
          v-model="newProduct.sub_image_urls"
          id="subImageUrls"
          placeholder="서브 이미지 URL을 공백으로 구분하여 입력하세요."
          rows="4"
          required
        ></textarea>
  
        <button type="submit">상품 등록</button>
      </form>
    </div>
</template>
  
<script setup>
    import { ref, onMounted, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { supabase } from '../supabase';

    const router = useRouter();
    const newProduct = ref({
    name: '',
    price: '',
    description: '',
    category_id: null,
    sub_id: null,
    image_urls: '', // 메인 이미지 URL
    sub_image_urls: '', // 서브 이미지 URL
    });

    const categories = ref([]);
    const selectedCategory = ref(null);
    const categoryMap = ref({});

    const addProduct = async () => {
    if (!newProduct.value.image_urls) {
        alert('메인 이미지를 먼저 입력해주세요!');
        return;
    }

    const mainImage = newProduct.value.image_urls; // 메인 이미지 URL
    const subImages = newProduct.value.sub_image_urls.split(' ').slice(0, 10); // 최대 10개 서브 이미지 URL

    // 상품 등록 (products 테이블)
    const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([
        {
            name: newProduct.value.name,
            price: newProduct.value.price,
            description: newProduct.value.description,
            image_url: mainImage, // 메인 이미지 URL
            category_id: newProduct.value.category_id,
            sub_id: newProduct.value.sub_id,
        },
        ])
        .single();

    if (productError) {
        console.error('상품 등록 실패:', productError.message);
        return;
    }

    // 서브 이미지 등록 (product_images 테이블에 저장)
    for (let i = 0; i < subImages.length; i++) {
        const url = subImages[i];
        const { error: subError } = await supabase
        .from('product_images')
        .insert([
            {
            product_id: productData.id, // 방금 등록한 상품 ID
            image_url: url,
            sort_order: i, // 이미지 순서대로
            },
        ]);
        
        if (subError) {
        console.error('서브 이미지 등록 실패:', subError.message);
        }
    }

    alert('상품이 등록되었습니다!');
    router.push('/');
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('id, name, subcategories(id, name)')
            .order('id');

        if (error) {
            console.error('카테고리 불러오기 실패:', error.message);
        } else {
            categories.value = data;
            categories.value.forEach((cat) => {
            categoryMap.value[cat.name] = cat;
            });
        }
    };

    watch(
        () => newProduct.value.category_id,
        (newCategoryId) => {
            selectedCategory.value = categoryMap.value[Object.keys(categoryMap.value).find((key) => categoryMap.value[key].id === newCategoryId)];
        }
    );

    onMounted(() => {
        fetchCategories();
    });
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
  </style>
  
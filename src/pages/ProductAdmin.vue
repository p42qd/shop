<template>
    <div class="product-admin">
      <h1>상품 관리</h1>
  
      <!-- 상단 컨트롤 영역 -->
      <div class="controls">
        <button class="primary-btn" @click="router.push('/desk-control/products/add')">상품 등록</button>
        <input type="text" v-model="searchTerm" placeholder="상품명 검색" />
      </div>
  
      <!-- 상품 리스트 -->
      <table class="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>상품명</th>
            <th>카테고리</th>
            <th>소분류</th>
            <th>메인 이미지</th>
            <th>서브 이미지 수</th>
            <th>등록일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedProducts" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.category_name || '-' }}</td>
            <td>{{ item.subcategory_name || '-' }}</td>
            <td>
              <img :src="item.image_url" alt="메인 이미지" class="thumb" v-if="item.image_url" />
            </td>
            <td>{{ item.sub_image_count }}</td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td>
              <button class="edit-btn" @click="editProduct(item)">수정</button>
              <button class="delete-btn" @click="deleteProduct(item)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <!-- 페이지네이션 -->
      <div class="pagination">
        <button :disabled="page === 1" @click="page--">이전</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page === totalPages" @click="page++">다음</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { supabase } from '../supabase';
  
  const router = useRouter();
  
  const products = ref([]);
  const searchTerm = ref('');
  const page = ref(1);
  const pageSize = 20;
  const totalPages = ref(1);
  
  onMounted(() => {
    loadPage();
  });
  
  watch([searchTerm, page], loadPage);
  
  async function loadPage() {
    const from = (page.value - 1) * pageSize;
    const to = from + pageSize - 1;
  
    const { data: productData, error, count } = await supabase
      .from('products')
      .select('*, categories(name), subcategories(name), product_images(id, image_filename)', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });
  
    if (!error && productData) {
      products.value = productData.map(p => ({
        ...p,
        category_name: p.categories?.name,
        subcategory_name: p.subcategories?.name,
        sub_image_count: p.product_images?.length || 0,
        sub_filenames: p.product_images?.map(img => img.image_filename) || []
      }));
      totalPages.value = Math.ceil((count || 0) / pageSize);
    }
  }
  
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ko-KR');
  }
  
  function editProduct(product) {
    router.push(`/desk-control/products/edit/${product.id}`);
  }
  
  async function deleteProduct(product) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const storage = supabase.storage.from('product-images');
    const prefix = 'products/';
    const filenames = [];

    // 메인 이미지
    if (product.main_image_filename) {
        filenames.push(product.main_image_filename);
    }

    // 서브 이미지들
    if (product.sub_filenames && product.sub_filenames.length) {
        filenames.push(...product.sub_filenames);
    }

    // 실제 스토리지에 존재하는 파일 목록 조회
    const { data: existingList, error: listError } = await storage.list('products', {
        limit: 1000
    });

    if (listError) {
        console.error('스토리지 목록 조회 실패:', listError.message);
        alert('스토리지 목록 조회 실패');
        return;
    }

    const existingNames = new Set((existingList || []).map(f => f.name));
    const filesToDelete = filenames
        .filter(name => existingNames.has(name))
        .map(name => `${prefix}${name}`);

    if (filesToDelete.length > 0) {
        const { error: removeError } = await storage.remove(filesToDelete);
        if (removeError) {
        console.error('스토리지 삭제 실패:', removeError.message);
        alert('스토리지 이미지 삭제 실패');
        return;
        }
        console.log('스토리지 삭제 성공:', filesToDelete);
    } else {
        console.log('삭제 대상 파일 없음 (이미 삭제되었거나 존재하지 않음)');
    }

    // DB 삭제 (확실하게)
    await supabase.from('product_images').delete().eq('product_id', product.id);
    await supabase.from('products').delete().eq('id', product.id);

    alert('상품 및 이미지가 정상적으로 삭제되었습니다.');
    loadPage();
    }


  
  const paginatedProducts = computed(() => {
    return products.value.filter(p => p.name.includes(searchTerm.value));
  });
  </script>
  
  <style scoped>
  .product-admin {
    padding: 20px;
  }
  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  .controls button.primary-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }
  .controls button.primary-btn:hover {
    background-color: #0056b3;
  }
  .product-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .product-table th,
  .product-table td {
    padding: 10px;
    border: 1px solid #ccc;
    text-align: center;
  }
  .product-table img.thumb {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  .product-table button {
    margin: 2px;
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  }
  .edit-btn {
    background-color: #28a745;
    color: white;
  }
  .edit-btn:hover {
    background-color: #218838;
  }
  .delete-btn {
    background-color: #dc3545;
    color: white;
  }
  .delete-btn:hover {
    background-color: #c82333;
  }
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }
  .pagination button {
    padding: 6px 12px;
    font-size: 14px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .pagination button:disabled {
    background: #999;
    cursor: not-allowed;
  }
  </style>
  
<template>
  <div class="product-admin">
    <h1>상품 관리</h1>

    <div class="top-bar">
      <div class="search-area">
        <input type="text" v-model="filters.name" placeholder="상품명" />

        <select v-model="filters.category_id">
          <option value="">전체 카테고리</option>
          <option v-for="cat in categoryList" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>

        <select v-model="filters.sub_id">
          <option value="">전체 소분류</option>
          <option v-for="sub in subcategoryList" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
        </select>

        <select v-model="sortOption">
          <option value="created_desc">등록일 ↓</option>
          <option value="created_asc">등록일 ↑</option>
          <option value="name_asc">이름 ↑</option>
          <option value="name_desc">이름 ↓</option>
        </select>

        <button class="search-btn" @click="triggerSearch">검색</button>
      </div>

      <button class="primary-btn" @click="router.push('/desk-control/products/add')">상품 등록</button>
    </div>

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
        <tr v-for="item in products" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ categoryMap[item.category_id] || '-' }}</td>
          <td>{{ subcategoryMap[item.sub_id] || '-' }}</td>
          <td>
            <img :src="item.image_url" class="thumb" v-if="item.image_url" />
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

    <div class="pagination">
      <button :disabled="page === 1" @click="changePage(page - 1)">이전</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page === totalPages" @click="changePage(page + 1)">다음</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

const router = useRouter();

const filters = ref({
  name: '',
  category_id: '',
  sub_id: ''
});
const sortOption = ref('created_desc');
const searchTriggered = ref(false);

const page = ref(1);
const pageSize = 20;
const totalPages = ref(1);
const products = ref([]);
const categoryList = ref([]);
const subcategoryList = ref([]);

const categoryMap = computed(() => Object.fromEntries(categoryList.value.map(c => [c.id, c.name])));
const subcategoryMap = computed(() => Object.fromEntries(subcategoryList.value.map(s => [s.id, s.name])));

onMounted(async () => {
  await loadCategories();
  await loadSubcategories();
  searchTriggered.value = true;
  await loadPage();
});

async function loadCategories() {
  const { data, error } = await supabase.from('categories').select('id, name');
  if (!error) categoryList.value = data;
}
async function loadSubcategories() {
  const { data, error } = await supabase.from('subcategories').select('id, name');
  if (!error) subcategoryList.value = data;
}

function triggerSearch() {
  page.value = 1;
  searchTriggered.value = true;
  loadPage();
}

function changePage(newPage) {
  page.value = newPage;
  loadPage();
}

function getSortField() {
  const map = {
    created: 'created_at',
    name: 'name'
  };
  const [key, dir] = sortOption.value.split('_');
  return { field: map[key] || 'created_at', asc: dir === 'asc' };
}

async function loadPage() {
  if (!searchTriggered.value) return;

  const from = (page.value - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase.from('products').select('*', { count: 'exact' });

  if (filters.value.name) {
    query = query.ilike('name', `%${filters.value.name}%`);
  }
  if (filters.value.category_id) {
    query = query.eq('category_id', filters.value.category_id);
  }
  if (filters.value.sub_id) {
    query = query.eq('sub_id', filters.value.sub_id);
  }

  const { field, asc } = getSortField();
  query = query.order(field, { ascending: asc }).range(from, to);

  const { data, error, count } = await query;

  if (!error && data) {
    const ids = data.map(p => p.id);
    const { data: images } = await supabase
      .from('product_images')
      .select('product_id')
      .in('product_id', ids);

    const subImageCount = images?.reduce((acc, img) => {
      acc[img.product_id] = (acc[img.product_id] || 0) + 1;
      return acc;
    }, {}) || {};

    products.value = data.map(p => ({
      ...p,
      sub_image_count: subImageCount[p.id] || 0
    }));
    totalPages.value = Math.ceil((count || 0) / pageSize);
  }
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('ko-KR');
}

function editProduct(p) {
  router.push(`/desk-control/products/edit/${p.id}`);
}

async function deleteProduct(product) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  const storage = supabase.storage.from('product-images');
  const prefix = 'products/';
  const filenames = [];

  if (product.main_image_filename) filenames.push(product.main_image_filename);

  const { data: subImgs } = await supabase
    .from('product_images')
    .select('image_filename')
    .eq('product_id', product.id);

  if (subImgs?.length) {
    filenames.push(...subImgs.map(i => i.image_filename));
  }

  const { data: existingList } = await storage.list('products', { limit: 1000 });
  const existingNames = new Set((existingList || []).map(f => f.name));
  const toDelete = filenames.filter(name => existingNames.has(name)).map(name => `${prefix}${name}`);

  if (toDelete.length) {
    const { error: removeErr } = await storage.remove(toDelete);
    if (removeErr) {
      alert('스토리지 이미지 삭제 실패');
      return;
    }
  }

  await supabase.from('product_images').delete().eq('product_id', product.id);
  await supabase.from('products').delete().eq('id', product.id);
  alert('상품 삭제 완료');
  loadPage();
}
</script>

<style scoped>
.product-admin {
  padding: 20px;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.search-area {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.search-area input,
.search-area select,
.search-btn {
  height: 40px;
  font-size: 14px;
  padding: 0 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
.search-area input {
  width: 200px;
}
.search-btn {
  background-color: white;
  cursor: pointer;
  min-width: 60px;
}
.search-btn:hover {
  background-color: #f0f0f0;
}
.primary-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0 16px;
  height: 40px;
  font-size: 14px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}
.primary-btn:hover {
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

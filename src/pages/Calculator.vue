<template>
    <div class="page-container">
      <div class="left-section">
        <div class="input-result-wrap">
          <div class="input-area">
            <h2>값 입력 구역</h2>
            <div class="form-group">
              <label>환율 (1위안 = ₩)</label>
              <input type="number" v-model.number="exchangeRate" placeholder="예: 195.07" @input="recalculate" />
            </div>
            <div class="form-group">
              <label>중국 가격 (위안)</label>
              <input type="number" v-model.number="chinaPrice" placeholder="예: 200" @input="recalculate" />
            </div>
            <div class="form-group">
              <label>배송비 (₩)</label>
              <input type="number" v-model.number="shippingFee" placeholder="예: 18000" @input="recalculate" />
            </div>
            <div class="form-group">
              <label>수수료율 (예: 0.35 → 35%)</label>
              <input type="number" v-model.number="feeRate" placeholder="예: 0.35" step="0.01" @input="recalculate" />
            </div>
            <div class="form-group">
              <label>메모</label>
              <input type="text" v-model="memo" placeholder="예: 스카프" />
            </div>
          </div>
  
          <div class="result-area">
            <h2>실시간 계산 결과</h2>
            <p>한국 가격: ₩ {{ formatNumber(koreaPrice) }}</p>
            <p>수수료 ({{ (feeRate * 100).toFixed(0) }}%): ₩ {{ formatNumber(fee) }}</p>
            <p class="total-price">총합: ₩ {{ formatNumber(total) }}</p>
  
            <button @click="record" class="record-button">기록하기</button>
          </div>
        </div>
      </div>
  
      <div class="right-section">
        <h2>계산 기록</h2>
        <div v-if="records.length">
          <ul class="record-list">
            <li v-for="(record, index) in records" :key="index" class="record-item">
              <div>{{ record.memo || '메모 없음' }} - 총합: ₩ {{ formatNumber(record.total) }}</div>
              <button @click="deleteRecord(index)" class="delete-button">삭제</button>
            </li>
          </ul>
          <div class="total-amount">
            총합 합계: ₩ {{ formatNumber(totalSum) }}
          </div>
        </div>
        <div v-else class="no-records">
          계산 기록이 없습니다.
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  const exchangeRate = ref(null);
  const chinaPrice = ref(null);
  const shippingFee = ref(null);
  const feeRate = ref(0.35);
  const memo = ref('');
  
  const koreaPrice = ref(0);
  const fee = ref(0);
  const total = ref(0);
  
  const records = ref([]);
  
  function recalculate() {
    const exchange = Number(exchangeRate.value) || 0;
    const price = Number(chinaPrice.value) || 0;
    const shipping = Number(shippingFee.value) || 0;
    const feeRateValue = Number(feeRate.value) || 0;
  
    koreaPrice.value = price * exchange;
    fee.value = (koreaPrice.value + shipping) * feeRateValue;
    total.value = koreaPrice.value + shipping + fee.value;
  }
  
  function record() {
    if (!exchangeRate.value || chinaPrice.value == null || shippingFee.value == null || feeRate.value == null) {
      alert('모든 값을 입력하세요.');
      return;
    }
    records.value.push({
      memo: memo.value,
      koreaPrice: koreaPrice.value,
      fee: fee.value,
      total: total.value,
    });
    memo.value = '';
  }
  
  function deleteRecord(index) {
    records.value.splice(index, 1);
  }
  
  function formatNumber(num) {
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  }
  
  const totalSum = computed(() => {
    return records.value.reduce((sum, record) => sum + record.total, 0);
  });
  </script>
  
  <style scoped>
  .page-container {
    display: flex;
    gap: 20px;
    padding: 40px;
    background-color: #f5f7fa;
    min-height: 100vh;
    box-sizing: border-box;
    flex-wrap: wrap;
  }
  
  .left-section {
    flex: 2;
    display: flex;
    flex-direction: column;
  }
  
  .input-result-wrap {
    display: flex;
    gap: 20px;
  }
  
  .input-area,
  .result-area {
    flex: 1;
    background: #ffffff;
    padding: 24px;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }
  
  h2 {
    font-size: 20px;
    margin-bottom: 20px;
    color: #2c3e50;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
  }
  
  label {
    font-size: 14px;
    color: #555;
    margin-bottom: 6px;
  }
  
  input {
    height: 36px;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 0 10px;
    font-size: 14px;
  }
  
  .result-area p {
    margin: 6px 0;
    font-size: 16px;
    color: #333;
  }
  
  .result-area .total-price {
    font-size: 22px;
    color: #3498db;
    font-weight: bold;
    margin-top: 20px;
  }
  
  .record-button {
    margin-top: 24px;
    width: 100%;
    background-color: #3498db;
    border: none;
    padding: 14px;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .record-button:hover {
    background-color: #2980b9;
  }
  
  .right-section {
    flex: 1;
    background: #ffffff;
    padding: 24px;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
  }
  
  .record-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .record-item {
    background: #f8f9fa;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 8px;
    font-size: 15px;
    color: #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .delete-button {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  
  .delete-button:hover {
    background: #c0392b;
  }
  
  .total-amount {
    margin-top: 20px;
    padding: 14px;
    background: #3498db;
    color: white;
    text-align: center;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
  }
  
  .no-records {
    margin-top: 20px;
    text-align: center;
    color: #999;
  }
  
  @media (max-width: 768px) {
    .page-container {
      flex-direction: column;
    }
    .input-result-wrap {
      flex-direction: column;
    }
  }
  </style>
  
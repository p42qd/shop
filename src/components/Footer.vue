<!-- src/components/Footer.vue -->
<template>
    <footer class="footer">
      <div class="footer-container">
        <p>ⓒ 2025 hamao. All rights reserved.</p>
        <p class="contact">고객센터: hamao 고객문의 | Instagram: @hamao_select</p>
      </div>
    </footer>
  </template>
  
  <script setup>
  // 추가 로직은 현재 없음
  </script>
  
  <style scoped>
  .footer {
    background-color: #f4f4f4;
    border-top: 1px solid #ddd;
    padding: 24px 16px;
    margin-top: 48px;
    font-size: 14px;
    color: #555;
  }
  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }
  .contact {
    margin-top: 8px;
    font-size: 13px;
    color: #888;
  }
  </style>
  
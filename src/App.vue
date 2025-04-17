
<template>
  <div class="container">
    <Header/>
    <router-view />
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'; 
</script>

<style scoped>
body {
  background-color: #f8f9fa;
  color: #1f1f1f;
}

.container {
  /* background-color: #f9fafb; */
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  margin-top: 140px;
}

@media (min-width: 768px) {
  .container {
    margin-top: 100px;
  }
}
</style>

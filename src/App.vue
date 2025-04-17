
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
.container {
  background-color: #f9fafb;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  margin-top: 140px;
}

@media (min-width: 768px) {
  .container {
    margin-top: 70px;
  }
}
</style>

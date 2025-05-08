<!-- src/components/AdminPasswordModal.vue -->
<template>
    <div class="modal" v-if="visible">
      <div class="modal-content">
        <h3>관리자 비밀번호 입력</h3>
        <input type="password" v-model="password" @keydown.enter="submit" autofocus />
        <div class="actions">
          <button @click="submit">확인</button>
          <button @click="cancel">취소</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const emit = defineEmits(['submit', 'cancel']);
  const password = ref('');
  const visible = ref(true);
  
  const submit = () => {
    emit('submit', password.value);
    visible.value = false;
  };
  
  const cancel = () => {
    emit('cancel');
    visible.value = false;
  };
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 10px;
    width: 300px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  }
  
  input {
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    box-sizing: border-box;
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 15px;
    gap: 8px;
  }
  </style>
  
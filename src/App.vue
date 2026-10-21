
<script setup>
import { useUserStore } from './stores/user';
const userStore = useUserStore();
</script>
<template>
    <main>
    <RouterView :key="userStore.user?.uid || 'guest'" />
  </main>
</template>

<style>

* {
  margin: 0;
  padding: 0;
}

</style>

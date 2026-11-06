
<script setup>
import { provide, ref } from 'vue';
import AnalyticsConsent from './components/AnalyticsConsent.vue';
import { useUserStore } from './stores/user';
const userStore = useUserStore();
const consent = ref(null);
provide('openAnalyticsPreferences', () => consent.value?.openPreferences());
</script>
<template>
    <main>
    <RouterView :key="userStore.user?.uid || 'guest'" />
  </main>
  <AnalyticsConsent ref="consent" />
</template>

<style>

* {
  margin: 0;
  padding: 0;
}

</style>

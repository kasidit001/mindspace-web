<script setup lang="ts">
// Blocking inline script: decides light vs dark before first paint, reading
// a saved choice first and falling back to the OS preference. Runs in
// <head>, synchronously, so there's no flash of the wrong theme on load.
useHead({
  script: [
    {
      key: 'theme-init',
      innerHTML: `(function(){try{var t=localStorage.getItem('mindspace:theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`,
      tagPosition: 'head'
    }
  ]
})

const { syncFromDom } = useTheme()
const { syncFromStorage } = useAuth()
onMounted(() => {
  syncFromDom()
  syncFromStorage()
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CommandPalette />
  </div>
</template>

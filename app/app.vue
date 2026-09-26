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
onMounted(async () => {
  syncFromDom()
  // Every page's own useFetch (useCourses, useLesson, ...) already ran in
  // setup() by the time this fires — before syncFromStorage's synchronous
  // hydrate() has restored the auth token from localStorage. A SYSTEM_ADMIN's
  // very first paint of any page would otherwise permanently miss their
  // Authorization header (useFetch doesn't reliably re-trigger just because
  // a `headers` computed re-evaluates). Force one explicit refetch of
  // everything on the page once the real session state is known.
  await syncFromStorage()
  refreshNuxtData()
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

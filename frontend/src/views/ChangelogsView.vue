<template>
  <div class="changelog-container">
    <RouterLink to="/">
      <a-button class="home-button">Home</a-button>
    </RouterLink>
    <Changelog :changelogs="changelogs" />
  </div>
</template>
<style scoped>
.changelog-container {
  width: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.home-button {
  margin: 1rem;
}
</style>

<script lang="ts" setup>
import Changelog from '@/components/Changelog.vue';

const changelogs = [
  {
    title: 'Version 0.2.0 Beta',
    body: 'Chat Tabs, Images and Gifs in chat',
    server: 'current version',
    green: true
  },
  {
    title: 'Version 0.1.0 Beta',
    body: 'Feature: AI Integration',
  },
  {
    title: 'Version 0.0.4 Beta',
    body: 'Bugfix: Estimation chart disappears when an estimate is changed after reveal',
  },
  {
    title: 'Version 0.0.3 Beta',
    body: 'Changelogs added',
  },
  {
    title: 'Version 0.0.2 Beta',
    body: 'Bug report and change request added',
  },
  {
    title: 'Version 0.0.1 Beta',
    body: 'T-Shirt and Powers of Two estimation modes added alongside Fibonacci.<br/> Active session count is now visible on the home screen.',
  }
]
</script>

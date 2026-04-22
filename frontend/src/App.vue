<script setup lang="ts">
import { RouterView } from 'vue-router';
import EmojiRain from '@/components/EmojiRain.vue';
import ProNagModal from '@/components/ProNagModal.vue';
import { showProNag } from '@/api/proService';
import { Lit } from "litlyx-js";
import environment from "@/environments/environments";

Lit.init(environment.litProject, {
  server: { port: 443, secure: true, host: environment.litDomain }
})

const antTheme = {
  token: {
    colorPrimary: '#d4ff3a',
    colorBgContainer: '#161c25',
    colorBorder: '#2b3442',
    borderRadius: 10,
    colorText: '#f5ecd7',
    colorTextSecondary: '#c4bca9',
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
  }
};
</script>

<template>
  <a-config-provider :theme="antTheme">
    <RouterView />
    <EmojiRain />
    <ProNagModal v-if="showProNag" />
  </a-config-provider>
</template>

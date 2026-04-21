<template>
  <footer class="footer">
    <nav>
      <ul class="footer-links">
        <li v-for="(link, index) in links" :key="index">
          <RouterLink :to="link.href">{{ link.text }}</RouterLink>
        </li>
      </ul>
    </nav>
  </footer>
</template>

<script lang="ts" setup>
const links = [
  { text: 'Changelog', href: '/changelog'},
  { text: 'Suggest a change', href: '/changerequest' },
  { text: 'Report a bug', href: '/bugreport' },
]
</script>

<style scoped>
.footer {
  padding: 20px;
  text-align: center;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
}

.footer-links li {
  margin: 0 10px;
}

.footer-links a {
  color: #007bff;
  text-decoration: none;
}

.footer-links a:hover {
  text-decoration: underline;
}
</style>

<template>
  <Main></Main>
</template>

<script>
import Main from "@/components/main";
export default {
  name: "App",
  components: {
    Main,
  },
};
</script>

<style>
body {
  font: 400 16px Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI,
    Helvetica, Arial, sans-serif;
}
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>

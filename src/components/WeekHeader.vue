<template>
  <span
    v-for="(mark, idx) in weekdays"
    :key="mark"
    :class="['day', 'mark', 'w' + idx]"
    >{{ mark }}</span
  >
</template>

<script>
export default {
  setup() {
    return {
      weekdays: "SMTWTFS".split(""),
    };
  },
};
</script>

<style>
</style>
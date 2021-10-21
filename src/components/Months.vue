<template>
  <Month
    v-for="m in months"
    :key="m.join('-')"
    :year="m[0]"
    :month="m[1]"
    :editMode="editMode"
  ></Month>
</template>

<script>
import { computed } from "vue";
import Month from "./Month";

export default {
  props: ["startDate", "endDate", "editMode"],
  components: {
    Month,
  },
  setup(props) {
    const months = computed(() => {
      const ds = [];
      const date = new Date(props.startDate);
      while (date <= props.endDate) {
        ds.push([date.getFullYear(), date.getMonth()]);
        date.setMonth(date.getMonth() + 1);
      }
      return ds;
    });

    return {
      months,
    };
  },
};
</script>

<style>
</style>
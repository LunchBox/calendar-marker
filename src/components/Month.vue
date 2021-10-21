<template>
  <div class="calendar">
    <span
      v-for="(mark, idx) in weekdays"
      :key="mark"
      :class="['day', 'mark', 'w' + idx]"
      >{{ mark }}</span
    >
    <span
      v-for="d in dates"
      :key="d"
      :class="dayClass(d)"
      :title="dayTitle(d)"
      @click="toggleDate(d)"
    >
      <span v-if="d.getDate() === 1" class="month-mark">
        {{ monthName(d) }}
      </span>
      <span>{{ d.getDate() }}</span>
    </span>
  </div>
</template>

<script>
import { computed } from "vue";

import HOLIDAYS from "./holiday/mo2021";
import { isHoliday, fDate, getMonthName } from "./utils.js";

import { toggle, selected } from "./useSelection";

export default {
  props: ["editMode", "dates"],
  setup(props) {
    const weekdays = "SMTWTFS".split("");

    const dayClass = computed(() => {
      return (date) => {
        let cs = ["day", `w${date.getDay()}`, `m${date.getMonth() % 2}`];
        let dStr = fDate(date);

        cs.push({
          holiday: isHoliday(date),
          active: selected(dStr),
        });

        return cs;
      };
    });

    const dayTitle = computed(() => {
      return (date) => {
        const dStr = fDate(date);
        const str = [dStr];
        if (isHoliday(date)) {
          str.push(HOLIDAYS[dStr]);
        }
        return str.join(",");
      };
    });

    const monthName = computed(() => {
      return (date) => getMonthName(date);
    });

    const toggleDate = (date) => {
      if (props.editMode) {
        toggle(date);
      }
    };

    return {
      weekdays,
      dayClass,
      dayTitle,
      monthName,
      toggleDate,
    };
  },
};
</script>

<style>
</style>
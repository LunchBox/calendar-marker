<template>
  <div>
    <div style="text-align: center">{{ monthLabel }}</div>
    <div class="calendar">
      <WeekHeader></WeekHeader>
      <span
        v-for="d in dates"
        :key="d"
        :class="dayClass(d)"
        :title="dayTitle(d)"
        @click="toggleDate(d)"
      >
        <span>{{ d.getDate() }}</span>
      </span>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

import { dateOffset, getDatesBetween, fDate, getMonthName } from "./utils";

import { isHoliday, dayLabel } from "./useHoliday.js";
import { selected, toggle } from "./useSelection";

import WeekHeader from "./WeekHeader";

export default {
  props: ["year", "month", "editMode"],
  components: {
    WeekHeader,
  },
  setup(props) {
    const firstDay = new Date(props.year, props.month);

    const startDay = dateOffset(firstDay, -firstDay.getDay());

    const lastDay = dateOffset(new Date(props.year, props.month + 1), -1);

    const endDay = dateOffset(lastDay, 6 - lastDay.getDay());

    const dates = getDatesBetween(startDay, endDay);

    const monthLabel = getMonthName(firstDay);

    const dayClass = computed(() => {
      return (date) => {
        let cs = ["day", `w${date.getDay()}`, `m${date.getMonth() % 2}`];
        let dStr = fDate(date);

        cs.push({
          holiday: isHoliday(date),
          active: selected(dStr),
          out: date.getMonth() !== +props.month,
        });

        return cs;
      };
    });

    const dayTitle = computed(() => {
      return (date) => {
        const dStr = fDate(date);
        const str = [dStr];

        if (isHoliday(date)) {
          str.push(dayLabel(date));
        }

        return str.join(",");
      };
    });

    function toggleDate(date) {
      if (props.editMode) {
        toggle(date);
      }
    }

    return {
      monthLabel,
      dates,
      dayClass,
      dayTitle,
      toggleDate,
    };
  },
};
</script>

<style>
</style>
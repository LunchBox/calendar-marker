import { fDate } from "./utils.js";

import { holidays } from "@/api/holidays";

function getHoliday(date) {
  return holidays.value.find((item) => item.date === fDate(date));
}

function isHoliday(date) {
  return getHoliday(date);
}

function dayLabel(date) {
  const day = getHoliday(date);
  return day ? day.name : null;
}

export { isHoliday, dayLabel };

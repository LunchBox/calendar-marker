import { fDate } from "./utils.js";

import HOLIDAYS from "./holiday/mo2021";

function isHoliday(date) {
  return Object.keys(HOLIDAYS).includes(fDate(date));
}

function dayLabel(date) {
  return HOLIDAYS[fDate(date)];
}

export { isHoliday, dayLabel };

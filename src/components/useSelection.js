import { ref } from "vue";
import { fDate } from "./utils.js";

const selection = ref([]);

function toggle(date) {
  let ds = selection.value;
  let dStr = fDate(date);
  if (ds.includes(dStr)) {
    ds.splice(ds.indexOf(dStr), 1);
  } else {
    ds.push(dStr);
  }
}

function clear() {
  selection.value.splice(0);
}

function selected(dateStr) {
  return selection.value.includes(dateStr);
}

export { selection, toggle, clear, selected };

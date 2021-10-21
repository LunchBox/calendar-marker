import { reactive } from "vue";
import LZString from "lz-string";

import { fDate } from "./utils.js";

import { selection } from "./useSelection";

export default function (state, startDate, endDate) {
  const base = "2021-01-01";

  function date2Diff(dStr) {
    return (new Date(dStr) - new Date(base)) / 3600 / 24 / 1000;
  }

  function diff2Date(diff) {
    let d = new Date(base);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function encodeToUrl() {
    let ds = selection.value.map(date2Diff);
    let m = ds.length > 0 ? Math.min(...ds) : date2Diff(startDate.value);
    let d = reactive({
      t: state.title,
      m,
      s: date2Diff(startDate.value) - m,
      e: date2Diff(endDate.value) - m,
      ds: ds.map((d) => d - m),
      em: state.editMode ? 1 : 0
    });
    console.log(JSON.stringify(d));
    window.location.hash = LZString.compressToBase64(JSON.stringify(d));
  }

  function decodeUrl() {
    let b64 = window.location.hash;
    if (b64 && b64.trim() !== "") {
      const data = JSON.parse(LZString.decompressFromBase64(b64.slice(1)));
      console.log(data);
      let { m, s, e, ds, em, t } = data;
      state.title = t;
      state.sDate = diff2Date(s + m);
      state.eDate = diff2Date(e + m);

      selection.value = ds.map((d) => fDate(diff2Date(d + m)));

      state.editMode = em === 1;
    }
  }

  return {
    date2Diff,
    diff2Date,
    encodeToUrl,
    decodeUrl
  };
}

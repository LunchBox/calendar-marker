<template>
  <div>
    <div>
      Calendar Marker
      <sub style="font-weight: normal; font-size: small; color: #999"
        >v0.1 beta</sub
      >
    </div>
    <div>
      <input
        v-if="editMode"
        type="string"
        v-model="title"
        class="title"
        placeholder="Event Name"
      />
      <h2 v-else>{{ title }}</h2>
    </div>
    <div style="display: flex">
      <div>
        <div style="margin: 0.5em 0">
          <button @click="prereduceMonth">-1 Month</button>
          <button @click="preappendMonth">+1 Month</button>
        </div>
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
            {{ d.getDate() }}
          </span>
        </div>

        <div style="margin: 0.5em 0">
          <button @click="reduceMonth">-1 Month</button>
          <button @click="appendMonth">+1 Month</button>
          <button @click="saveToPng">Download</button>
          <button @click="snapshot">Snapshot</button>
        </div>
      </div>
      <div style="margin-left: 2em">
        <div style="display: flex">
          <label>
            <span>Start Date</span>
            <input type="date" v-model="startDate" />
          </label>
          <label>
            <span>End Date</span>
            <input type="date" v-model="endDate" />
          </label>
        </div>
        <div style="margin: 1em 0">
          <label>
            <input type="checkbox" v-model="editMode" />
            Edit
          </label>
        </div>

        <div>Dates: {{ selectedDates.length }}</div>
        <ul>
          <li v-for="d in selectedDates.sort()" :key="d">{{ d }}</li>
        </ul>

        <button @click="selectedDates.splice(0)">Clear</button>
      </div>
    </div>

    <div>
      <div>Snapshot</div>
      <div class="snapshot"></div>
    </div>
  </div>
</template>

<script>
import { ref, toRefs, reactive, computed, watch, onMounted } from "vue";
import domtoimage from "dom-to-image";
import LZString from "lz-string";
import { saveAs } from "file-saver";

const HOLIDAYS = {
  "2021-09-22": "中秋節翌日",
  "2021-10-01": "中華人民共和國國慶日",
  "2021-10-02": "中華人民共和國國慶日翌日",
  "2021-10-14": "重陽節",
  "2021-11-02": "追思節",
  "2021-12-08": "聖母無原罪瞻禮",
  "2021-12-20": "澳門特別行政區成立紀念日",
  "2021-12-21": "冬至",
  "2021-12-24": "聖誕節前日",
  "2021-12-25": "聖誕節",
};

// https://stackoverflow.com/questions/47232534/how-to-get-a-list-of-month-names-in-javascript-using-intl
function getMonthName(date, locale, format) {
  if (!locale) locale = navigator.language;
  if (!format) format = "short";
  const f1 = new Intl.DateTimeFormat(locale, { month: format }).format;
  const f2 = (m) => f1(new Date(Date.UTC(date.getFullYear(), m)));
  const marks = [...Array(12).keys()].map(f2);
  return marks[date.getMonth()];
}

function fDate(date) {
  return [
    date.getFullYear(),
    ("0" + (date.getMonth() + 1)).slice(-2),
    ("0" + date.getDate()).slice(-2),
  ].join("-");
}

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function lastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function dateOffset(date, offset) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

function getDatesBetweenDates(startDate, endDate) {
  let dates = [];
  const theDate = new Date(startDate);
  while (theDate <= endDate) {
    dates = [...dates, new Date(theDate)];
    theDate.setDate(theDate.getDate() + 1);
  }
  return dates;
}

export default {
  setup() {
    const today = new Date();
    const state = reactive({
      title: "",
      ttInput: null,
      sDate: today,
      eDate: lastDayOfMonth(today),
      selectedDates: [],
      editMode: true,
    });

    // computed
    const startDate = computed({
      get: () => fDate(state.sDate),
      set: (val) => (state.sDate = new Date(val)),
    });

    const endDate = computed({
      get: () => fDate(state.eDate),
      set: (val) => (state.eDate = new Date(val)),
    });

    const dates = computed(() => {
      let fd = firstDayOfMonth(new Date(state.sDate));
      fd = dateOffset(fd, -fd.getDay());

      let ed = lastDayOfMonth(new Date(state.eDate));
      ed = dateOffset(ed, 6 - ed.getDay());
      return getDatesBetweenDates(fd, ed);
    });

    const monthName = computed(() => {
      return (date) => getMonthName(date);
    });

    const dayClass = computed(() => {
      return (date) => {
        let cs = ["day", `w${date.getDay()}`, `m${date.getMonth() % 2}`];
        let dStr = fDate(date);

        if (isHoliday(date)) {
          cs.push("holiday");
        }

        if (state.selectedDates.includes(dStr)) {
          cs.push("active");
        }

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

    // methods

    const toggleDate = (date) => {
      if (state.editMode) {
        let ds = state.selectedDates;
        let dStr = fDate(date);
        if (ds.includes(dStr)) {
          ds.splice(ds.indexOf(dStr), 1);
        } else {
          ds.push(dStr);
        }
      }
    };

    const isHoliday = (date) => Object.keys(HOLIDAYS).includes(fDate(date));

    const weekdays = ref("SMTWTFS".split(""));

    const preappendMonth = () => {
      state.sDate = dateOffset(firstDayOfMonth(state.sDate), -1);
    };

    const prereduceMonth = () => {
      state.sDate = dateOffset(lastDayOfMonth(state.sDate), 1);
    };

    const appendMonth = () => {
      state.eDate = dateOffset(lastDayOfMonth(state.eDate), 1);
    };

    const reduceMonth = () => {
      state.eDate = dateOffset(firstDayOfMonth(state.eDate), -1);
    };

    const saveToPng = () => {
      domtoimage.toBlob(document.querySelector(".calendar")).then((blob) => {
        saveAs(blob, "schedule.png");
      });
    };

    const snapshot = () => {
      const node = document.querySelector(".calendar");
      domtoimage
        .toPng(node)
        .then((dataUrl) => {
          let img = new Image();
          img.src = dataUrl;
          let container = document.querySelector(".snapshot");
          container.innerHTML = "";
          container.appendChild(img);
        })
        .catch(function (error) {
          console.error("oops, something went wrong!", error);
        });
    };

    const base = "2021-01-01";
    const date2Diff = (dStr) =>
      (new Date(dStr) - new Date(base)) / 3600 / 24 / 1000;
    const diff2Date = (diff) => {
      let d = new Date(base);
      d.setDate(d.getDate() + diff);
      return d;
    };

    const saveToUrl = () => {
      let ds = state.selectedDates.map(date2Diff);
      let m = ds.length > 0 ? Math.min(...ds) : date2Diff(startDate.value);
      let d = reactive({
        t: state.title,
        m,
        s: date2Diff(startDate.value) - m,
        e: date2Diff(endDate.value) - m,
        ds: ds.map((d) => d - m),
        em: state.editMode ? 1 : 0,
      });
      console.log(JSON.stringify(d));
      window.location.hash = LZString.compressToBase64(JSON.stringify(d));
    };

    watch(state, saveToUrl, { deep: true });

    onMounted(() => {
      let b64 = window.location.hash;
      if (b64 && b64.trim() !== "") {
        const data = JSON.parse(LZString.decompressFromBase64(b64.slice(1)));
        console.log(data);
        let { m, s, e, ds, em, t } = data;
        state.title = t;
        state.sDate = diff2Date(s + m);
        state.eDate = diff2Date(e + m);
        state.selectedDates = ds.map((d) => fDate(diff2Date(d + m)));
        state.editMode = em === 1;
      }
    });

    return {
      ...toRefs(state),
      startDate,
      endDate,
      dates, // all days on calendar
      toggleDate,
      dayClass,
      dayTitle,
      weekdays, // calendar header
      monthName,
      preappendMonth,
      prereduceMonth,
      appendMonth,
      reduceMonth,
      saveToPng,
      snapshot,
    };
  },
};
</script>

<style>

label span {
  display: block;
}

h2,input.title {
  display: block;
  width: 100%;
  
  max-width: 640px;
  padding: 0 4px;
  margin: 1em 0;
  border: 1px solid #ccc;
  color: #2c3e50;
  font: 700 16pt Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif;
  line-height: 24pt;
  height: 24pt;
}
h2 {
  border: 1px solid transparent;
}

.calendar {
  --cell-size: 40px;
  --white:  rgba(255, 255, 255, 1);
  --gray-50:  rgba(249, 250, 251, 1);
  --gray-100:	rgba(243, 244, 246, 1);
  --gray-200:	rgba(229, 231, 235, 1);
  --gray-300:	rgba(209, 213, 219, 1);
  --gray-400:	rgba(156, 163, 175, 1);
  --gray-500:	rgba(107, 114, 128, 1);
  --gray-600:	rgba(75, 85, 99, 1);
  --gray-700:	rgba(55, 65, 81, 1);
  --gray-800:	rgba(31, 41, 55, 1);
  --gray-900:	rgba(17, 24, 39, 1);

  --weekend-bg: var(--gray-50);
  --day-hover-bg: var(--gray-400);
  --holiday-bg: var(--gray-200);
  --active-bg: var(--gray-600);


  display: flex;
  flex-wrap: wrap;

  width: calc(var(--cell-size) * 7);
  border: 1px solid #ccc;
  border-radius: 2px;

  font-size: 13px;
}

.day {
  width: var(--cell-size);
  height: var(--cell-size);
  box-sizing: border-box;
  border: 1px solid #fff;
  border-radius: 3px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  position: relative;
}

.day.mark {
  border-radius: 0;
}

.day.w0,
.day.w6 {
  background: var(--weekend-bg);
  border-top-color: var(--weekend-bg);
  border-bottom-color: var(--weekend-bg);
}

.day.holiday {
  background: var(--holiday-bg);
}

.day.active {
  background: var(--active-bg);
  color: #fff;
}
.day.holiday.active:before {
  content: " ";
  position: absolute;
  bottom: 0;
  right: 0;
  border-color: transparent var(--holiday-bg) var(--holiday-bg) transparent;
  border-width: 5px;
  border-style: solid;
}

.day:hover {
  background: var(--day-hover-bg);
  color: #444;
  cursor: pointer;
}

.month-mark {
  position: absolute;
  top: 0;
  left: 0;

  font-size: small;
}

</style>
<template>
  <div>
    <div style="display: flex">
      <div>
        <div class="calendar-wrapper">
          <div class="calendar-header">{{ title }}</div>
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
        </div>
        <section>
          <div>Dates: {{ selectedDates.length }}</div>
          <ul>
            <li v-for="d in selectedDates.sort()" :key="d">{{ d }}</li>
          </ul>
        </section>
      </div>
      <div style="margin-left: 2em">
        <div class="site-name">
          <a href="/" target="_blank">Calendar Marker</a>
          <sub>v0.1 beta</sub>
        </div>

        <section>
          <label>
            <input type="checkbox" v-model="editMode" />
            Edit Mode
          </label>
        </section>

        <section>
          <label>
            <span>Title</span>
            <textarea
              v-model="title"
              class="title"
              placeholder="Event Name"
            ></textarea>
          </label>
          <label>
            <span>Start Date</span>
            <button @click="preappendMonth">&lt; 1M</button>
            <input type="date" v-model="startDate" />
            <button @click="prereduceMonth">&gt; 1M</button>
          </label>
          <label>
            <span>End Date</span>
            <button @click="reduceMonth">&lt; 1M</button>
            <input type="date" v-model="endDate" />
            <button @click="appendMonth">&gt; 1M</button>
          </label>
        </section>

        <section>
          <h4>Import from ICal file.</h4>
          <input type="file" @change="importICal" />
        </section>

        <section>
          <div>
            <button @click="clearState">Clear</button>
            <button @click="exportICal">Export</button>
            <button @click="saveToPng">Download</button>
            <button @click="snapshot">Snapshot</button>
          </div>

          <div class="snapshot"></div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, toRefs, reactive, computed, watch, onMounted } from "vue";
import domtoimage from "dom-to-image";
import LZString from "lz-string";
import { saveAs } from "file-saver";
import ICAL from "ical.js";

import HOLIDAYS from "./holiday/mo2021";

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

    const clearState = () => {
      state.title = "";
      state.sDate = today;
      state.eDate = lastDayOfMonth(today);
      state.selectedDates.splice(0);
    };

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
      const node = document.querySelector(".calendar-wrapper");
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

    const exportICal = () => {
      const comp = new ICAL.Component(["vcalendar", [], []]);

      state.selectedDates.forEach((dStr) => {
        const vevent = new ICAL.Component("vevent");
        const event = new ICAL.Event(vevent);
        event.summary = state.title;
        // event.uid = "abcdef...";
        event.startDate = ICAL.Time.fromDateString(dStr);
        comp.addSubcomponent(vevent);
      });

      const blob = new Blob([comp.toString()], {
        type: "text/plain;charset=utf-8",
      });

      const fileName = state.title === "" ? "schedule" : state.title;
      saveAs(blob, `${fileName}.ics`);
    };

    const importICal = (e) => {
      let fr = new FileReader();
      fr.onload = () => {
        const jcalData = ICAL.parse(fr.result);
        const comp = new ICAL.Component(jcalData);
        const es = comp
          .getAllSubcomponents("vevent")
          .map((v) => new ICAL.Event(v));

        clearState();
        if (es[0] && es[0].summary && es[0].summary !== "") {
          state.title = es[0].summary;
        }
        state.selectedDates.splice(0);
        es.forEach((e) => {
          state.selectedDates.push(fDate(e.startDate.toJSDate()));
        });
        const ds = state.selectedDates.map((dStr) => new Date(dStr));
        state.sDate = new Date(Math.min(...ds));
        state.eDate = new Date(Math.max(...ds));
      };

      fr.readAsText(e.target.files[0]);
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
      clearState,
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
      exportICal,
      importICal,
    };
  },
};
</script>

<style>

.site-name sub {
  font-weight: normal; 
  font-size: small; 
  color: #999;
}

.site-name a {
  color: #2c3e50;
  text-decoration: none;
}

label span {
  display: block;
}

/* h2,input.title {
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
} */

h2 {
  border: 1px solid transparent;
}

textarea {
  width: 100%;
  min-height: 4em;
}

.calendar-wrapper {
  padding: 4px;
  width: min-content;
  border-radius: 4px;
  background: #fff;
}

.calendar-header {
  padding: 4px;
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
  top: -6px;;
  left: 0;
  right: 0;

  font-size: 12px;
  text-align: center;
  transform: scale(.9);
}

.month-mark + span {
  font-size: 16pt;
  font-weight: bold;
  text-decoration: underline;
}

section {
  margin: 1em 0;
}

.snapshot {
  margin: 1em 0;
  border: 1px solid #ccc;
  width: min-content;
}

.snapshot img {
  display: block;
}

</style>
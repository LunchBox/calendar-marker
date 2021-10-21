<template>
  <div>
    <div style="display: flex">
      <div>
        <div class="calendar-wrapper">
          <div class="calendar-header">{{ title }}</div>
          <Months
            :startDate="sDate"
            :endDate="eDate"
            :editMode="editMode"
          ></Months>
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
import { toRefs, reactive, computed, watch, onMounted } from "vue";

import Months from "./Months";

import {
  firstDayOfMonth,
  lastDayOfMonth,
  dateOffset,
  getDatesBetween,
  fDate,
} from "./utils.js";

import { selection, clear as clearSelection } from "./useSelection";

import useICal from "./useICal.js";
import useSaveToUrl from "./useSaveToUrl.js";
import useSnapshot from "./useSnapshot.js";

export default {
  components: {
    Months,
  },
  setup() {
    const today = new Date();

    const state = reactive({
      title: "",
      sDate: today,
      eDate: lastDayOfMonth(today),
      editMode: true,
    });

    const clearState = () => {
      state.title = "";
      state.sDate = today;
      state.eDate = lastDayOfMonth(today);
      clearSelection();
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
      return getDatesBetween(fd, ed);
    });

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

    const { snapshot, saveToPng } = useSnapshot(state);

    const { exportICal, importICal } = useICal(state);

    const { encodeToUrl, decodeUrl } = useSaveToUrl(state, startDate, endDate);

    watch(state, encodeToUrl, { deep: true });

    watch(selection, encodeToUrl, { deep: true });

    onMounted(decodeUrl);

    return {
      selectedDates: selection,
      ...toRefs(state),
      clearState,
      startDate,
      endDate,
      dates, // all days on calendar
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
.day.out {
  background: transparent;
  text-indent: -9999px;
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
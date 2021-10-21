import ICAL from "ical.js";
import { saveAs } from "file-saver";

import { fDate } from "./utils.js";

import { selection, clear } from "./useSelection";

export default function useICal(state) {
  function exportICal() {
    const comp = new ICAL.Component(["vcalendar", [], []]);

    const title = state.title;

    selection.value.forEach((dStr) => {
      const vevent = new ICAL.Component("vevent");
      const event = new ICAL.Event(vevent);
      event.summary = title;
      // event.uid = "abcdef...";
      event.startDate = ICAL.Time.fromDateString(dStr);
      comp.addSubcomponent(vevent);
    });

    const blob = new Blob([comp.toString()], {
      type: "text/plain;charset=utf-8"
    });

    const fileName = title === "" ? "schedule" : title;
    saveAs(blob, `${fileName}.ics`);
  }

  function importICal(e) {
    let fr = new FileReader();
    fr.onload = () => {
      const jcalData = ICAL.parse(fr.result);
      const comp = new ICAL.Component(jcalData);
      const es = comp
        .getAllSubcomponents("vevent")
        .map((v) => new ICAL.Event(v));

      if (es[0] && es[0].summary && es[0].summary !== "") {
        state.title = es[0].summary;
      }

      clear();

      es.forEach((e) => {
        selection.value.push(fDate(e.startDate.toJSDate()));
      });

      const ds = selection.value.map((dStr) => new Date(dStr));

      state.sDate = new Date(Math.min(...ds));
      state.eDate = new Date(Math.max(...ds));
    };

    fr.readAsText(e.target.files[0]);
  }

  return {
    importICal,
    exportICal
  };
}

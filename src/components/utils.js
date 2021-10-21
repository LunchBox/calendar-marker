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
    ("0" + date.getDate()).slice(-2)
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

function getDatesBetween(startDate, endDate) {
  let dates = [];
  const theDate = new Date(startDate);
  while (theDate <= endDate) {
    dates.push(new Date(theDate));
    theDate.setDate(theDate.getDate() + 1);
  }
  return dates;
}

export {
  getMonthName,
  fDate,
  firstDayOfMonth,
  lastDayOfMonth,
  dateOffset,
  getDatesBetween
};

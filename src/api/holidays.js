import axios from "axios";

import { ref } from "vue";

const holidays = ref([]);

axios.get("https://all-holidays.vercel.app/macau_2021.json").then((res) => {
  holidays.value.push(...res.data);
});

axios.get("https://all-holidays.vercel.app/macau_2022.json").then((res) => {
  holidays.value.push(...res.data);
});

export { holidays };

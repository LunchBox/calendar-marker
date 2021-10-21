import { saveAs } from "file-saver";
import domtoimage from "dom-to-image";
export default function () {
  function snapshot() {
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
  }

  function saveToPng() {
    domtoimage.toBlob(document.querySelector(".calendar")).then((blob) => {
      saveAs(blob, "schedule.png");
    });
  }

  return {
    snapshot,
    saveToPng
  };
}

import { setProxyFunc } from "./api";
import { submitPage } from "./submitPage";

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.color) {
    console.log("Receive color = " + msg.color);
    document.body.style.backgroundColor = msg.color;
    sendResponse("Change color to " + msg.color);
  } else {
    sendResponse("Color message is none.");
  }
});

if (window.location.href.match('https://if190.aca.ntu.edu.tw/graderanking/')) {
  setTimeout(() => setProxyFunc(submitPage));
}

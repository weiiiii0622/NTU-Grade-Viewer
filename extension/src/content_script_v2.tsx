import React from "react";
import { submitPage, submitPageV2 } from "./submitPage";
import { waitUntil } from "./utils";
import { createRoot } from "react-dom/client";
import { GradeChart } from "./components/gradeChart";
import { FixedBox } from "./components/fixedBox";
import { addMessageListener } from "./api_v2";

/* ------------------------------ Context Menu ------------------------------ */

window.addEventListener('click', () => console.log('click'))

let contextPos: [number, number] = [0, 0];
window.addEventListener("contextmenu", (e) => {
   const { clientX, clientY } = e;
   contextPos = [clientX, clientY]
});

const rootEle = document.createElement("div");
const root = createRoot(rootEle);
document.body.insertBefore(rootEle, document.body.firstChild);

console.log('hi')
addMessageListener('contextMenu', (msg) => {
   root.render(<FixedBox position={contextPos} />);
   // TODO: unmount
})

/* --------------------------------- Submit --------------------------------- */

const handleSubmitScore = async (sendResponse: (response?: any) => void) => {
   const res = await submitPageV2();
   sendResponse({
      data: res.data,
      status: res.status_code,
   });
};

addMessageListener('submitPage', (msg, sender, sendResponse) => {
   console.log(`Current Window Location: ${window.location.href}`);
   try {
      handleSubmitScore(sendResponse);
      return true;
   } catch (error) {
      console.log("SubmitScore Error:", error);
      sendResponse(`SubmitScore Error: ${error}`);
   }
})


/* ------------------------------ Search Items ------------------------------ */

function initSearchItem(node: HTMLElement) {
   if (node.getAttribute("inited") === "true") {
      console.log(node, "is inited");
      return;
   }

   const root = document.createElement("div");
   createRoot(root).render(
      <React.StrictMode>
         <GradeChart />
      </React.StrictMode>
   );
   node.querySelectorAll(".MuiBox-root").item(1).appendChild(root);
   node.setAttribute("inited", "true");
}

async function searchPageFeature() {
   const LIST = "ul.table";
   const ITEM = "li.MuiListItem-root";

   await waitUntil(() => !!document.querySelector(LIST));

   const listParent = document.querySelector(LIST)!;
   listParent
      .querySelectorAll(ITEM)
      .forEach((node) => initSearchItem(node as HTMLElement));

   function callback(mutations: MutationRecord[]) {
      mutations.forEach((m) => {
         m.addedNodes.forEach((node) => {
            if (node.nodeName !== "LI") {
               console.log(`Got ${node.nodeName}, ignored`);
               return;
            }
            initSearchItem(node as HTMLElement);
         });
      });
   }
   const ob = new MutationObserver(callback);
   ob.observe(listParent, { childList: true });
}

if (window.location.href.startsWith("https://course.ntu.edu.tw/search/")) {
   searchPageFeature();
}


import React from "react";
import { submitPage, submitPageV2 } from "./submitPage";
import { waitUntil } from "./utils";
import { createRoot } from "react-dom/client";
import { GradeChartLoader } from "./components/gradeChartLoader";
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


addMessageListener('submitPage', async (msg, sender) => {
   return await submitPageV2();
})

/* -------------------------------- Cookies --------------------------------- */
function checkCookie(cookieName: string) {
   let cookies = document.cookie.split(';');

   for (let i = 0; i < cookies.length; i++) {
       if (cookies[i].trim().indexOf(cookieName + '=') === 0) {
           return true;
       }
   }
   return false;
}


/* ------------------------------ Search Items ------------------------------ */

function initSearchItem(node: HTMLElement, isAuth: boolean) {
   if (node.getAttribute("inited") === "true") {
      console.log(node, "is inited");
      return;
   }

   const root = document.createElement("span");
   root.className = "mui-ahcpjm"
   createRoot(root).render(
      <React.StrictMode>
        <GradeChartLoader auth={isAuth} />
      </React.StrictMode>
   );
   const childList = node.querySelectorAll(".MuiBox-root")
   childList.item(childList.length - 1).prepend(root);
   node.setAttribute("inited", "true");
}

async function searchPageFeature() {
   const LIST = "ul.table";
   const ITEM = "li.MuiListItem-root";

   await waitUntil(() => !!document.querySelector(LIST));

   const isAuth = checkCookie("NTU_SCORE_VIEWER");

   const listParent = document.querySelector(LIST)!;
   listParent
      .querySelectorAll(ITEM)
      .forEach((node) => initSearchItem(node as HTMLElement, isAuth));

   function callback(mutations: MutationRecord[]) {
      mutations.forEach((m) => {
         m.addedNodes.forEach((node) => {
            if (node.nodeName !== "LI") {
               console.log(`Got ${node.nodeName}, ignored`);
               return;
            }
            initSearchItem(node as HTMLElement, isAuth);
         });
      });
   }
   const ob = new MutationObserver(callback);
   ob.observe(listParent, { childList: true });
}

if (window.location.href.startsWith("https://course.ntu.edu.tw/search/")) {
   // TEST only: Set Auth Cookie
   document.cookie = "NTU_SCORE_VIEWER=test123"   
   searchPageFeature();
}


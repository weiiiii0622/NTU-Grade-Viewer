import React from "react";
import { submitPage, submitPageV2 } from "./submitPage";
import { waitUntil } from "./utils";
import { createRoot } from "react-dom/client";
import { GradeChartLoader } from "./components/gradeChartLoader";
import { FixedBox } from "./components/fixedBox";
import { SnackBar, ISnackBarProps } from "./components/snackBar";
import { addMessageListener, sendRuntimeMessage, getStorage } from "./api_v2";


/* ------------------------------ Popup Message ----------------------------- */

addMessageListener('snackBar', (msg: ISnackBarProps) => {
   console.log(msg);
   const root = document.createElement("div");
   createRoot(root).render(
      <React.StrictMode>
        <SnackBar msg={msg.msg} severity={msg.severity} action={msg.action}/>
      </React.StrictMode>
   );
   document.body.append(root);
})

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
   root.className = "mui-ahcpjm";

   const childList = node.querySelectorAll(".MuiBox-root");
   const title = childList[1].childNodes[0].textContent;                            // 課程名稱
   const course_id1 = childList[0].childNodes[0].childNodes[1].textContent;         // 課號
   const course_id2 = childList[0].childNodes[0].childNodes[2].textContent;         // 識別碼
   let class_id = "";                                                               // 班次
   const lecturer = childList[2].childNodes[0].childNodes[0].textContent;
   
   const infos = childList[1].childNodes[1].childNodes;
   infos.forEach((info, idx) => {
      if (info.textContent?.startsWith("班次")) {
         class_id = info.textContent.slice(3);
      }
   })

   createRoot(root).render(
      <React.StrictMode>
        <GradeChartLoader auth={isAuth} title={title== null?"":title} course_id1={course_id1== null?"":course_id1} course_id2={course_id2== null?"":course_id2} lecturer={lecturer== null?"":lecturer} class_id={class_id== null?"":class_id}/>
      </React.StrictMode>
   );
   childList.item(childList.length - 1).prepend(root);
   node.setAttribute("inited", "true");
}


async function searchPageFeature() {

   // TEST only: Set Auth Cookie
   document.cookie = "NTU_SCORE_VIEWER=test123"

   const LIST = "ul.table";
   const ITEM = "li.MuiListItem-root";

   await waitUntil(() => !!document.querySelector(LIST));

   //const isAuth = checkCookie("NTU_SCORE_VIEWER");
   let token = await getStorage('token');
   const isAuth = (token !== undefined);

   const optionButton : any = document.querySelectorAll(".mui-tpbkxp")[1];
   console.log(optionButton)
   if(optionButton){
      // TODO restore user option setting
      let hasModified: boolean[] = [false, false, false, false, false, false, false, false, false, false, false]
      optionButton.click()
      await waitUntil(() => !!document.querySelector(".mui-12efj16"));
      const options = document.querySelector(".mui-12efj16")
      options?.childNodes.forEach((option:any, idx) => {
         // if (!option.childNodes[0].childNodes[0].checked) {
         //    option.click();
         //    hasModified[idx] = true;   
         // }
         if (option.textContent.startsWith("班次") && !option.childNodes[0].childNodes[0].checked) {
            option.click();
            hasModified[idx] = true;   
         }
      })
      optionButton.click()
   }

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


function registerFeature(fn: () => void, pattern: string | RegExp) {
   let previousUrl = "";
   console.log('hi')

   const callback = () => {
      if (window.location.href !== previousUrl) {
         console.log(`URL changed from ${previousUrl} to ${window.location.href}`);
         previousUrl = window.location.href;

         if (window.location.href.match(pattern)) {
            fn();
         }
      }
   }

   const observer = new MutationObserver(callback);
   observer.observe(document, { subtree: true, childList: true });

   callback();
}


registerFeature(searchPageFeature, "https://course.ntu.edu.tw/search/")
// if (window.location.href.startsWith()) {
//    searchPageFeature();
// }


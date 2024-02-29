import React from "react";
import { waitUntil, submitPage, clamp, rgbToHex } from "./utils";
import { createRoot } from "react-dom/client";
import { GradeChartLoader } from "./components/gradeChartLoader";
import { Dialog } from "./dialog/dialog";
import { TabAction, TabListenerState, TabMessageMap, addMessageListener, getStorage, setStorage, sendRuntimeMessage } from "./api";
import { SnackBar, ISnackBarProps } from "./components/snackBar";

// import './style.css';
// todo: move dialog to iframe

/* --------------------------- Initialze indicator -------------------------- */

function init() {
   const key = "NTU_GRADE_VIEWER__APP_INDICATOR";

   const node = document.createElement('div');
   node.id = key;
   node.style.visibility = 'hidden';
   document.body.insertBefore(node, null);

   const listenerStates: { [K in TabAction]: TabListenerState } = {
      'dialog': 'pending',
      'snackBar': 'pending',
      'submitPage': 'pending',
   };
   Object.entries(listenerStates).forEach(([k, v]) => {
      window[key].setAttribute(k, v);
   })
}
init();


/* -------------------------- Dialog (Context Menu) ------------------------- */

import styled from 'styled-components';
import { DIALOG_HEIGHT, DIALOG_WIDTH, DIALOG_GAP, DialogAction } from "./config";

let dialogActive: boolean = false;
let dialogPos: [number, number] = [0, 0];

let mousePos: [number, number] = [0, 0];
window.addEventListener('mousemove', (event) => {
   const { clientX: x, clientY: y } = event;
   mousePos = [x, y] as const;
});


function getDefaultPosition(): [number, number] {
   return [window.innerWidth / 2 - DIALOG_WIDTH / 2, window.innerHeight / 2 - DIALOG_HEIGHT / 2];
}

function getDialogPosition(): [number, number] {

   const getMousePosition = () => mousePos;

   const selection = window.getSelection();
   // if (!selection) return getMousePosition()
   if (!selection) return getDefaultPosition()


   const { isCollapsed } = selection;
   // todo: fix textarea/input
   // if (isCollapsed) return getMousePosition();
   if (isCollapsed) return getDefaultPosition();
   // console.log(isCollapsed)

   const range = selection.getRangeAt(0);
   let { x, y, height } = range.getBoundingClientRect();

   //console.log(x, y, height)

   if (y < window.innerHeight / 2)
      // pop from upside
      y += height + DIALOG_GAP;
   else
      // pop from downside
      y -= DIALOG_HEIGHT - DIALOG_GAP;

   x = Math.min(x, window.innerWidth - DIALOG_WIDTH);
   y = clamp(y, DIALOG_GAP, window.innerHeight - DIALOG_HEIGHT - DIALOG_GAP);

   //console.log('x, y: ', x, y)
   return [x, y];
}

// todo: maybe use snackbar for initial loading

// todo: refactor

function toRgb(s: string): [number, number, number] {
   try {
      return s.match(/\((.*)\)/)![1].split(',').slice(0, 3)
         .map(x => parseInt(x)) as [number, number, number];
   } catch {
      return [255, 255, 255];
   }
}




const bgColor = rgbToHex(toRgb(window.getComputedStyle(document.body, null)
   .getPropertyValue('background-color')))
console.log('bg: ', bgColor);

const frame = document.createElement('iframe');
frame.src = chrome.runtime.getURL('dialog.html') + `?bgColor=${encodeURIComponent(bgColor)}`;
document.body.insertBefore(frame, null);
frame.setAttribute('style', `
   z-index: 9999;
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background-color: transparent;
   border: none;
`);

function isInFrame(x: number, y: number) {
   // const l = parseFloat(frame.style.left), r = l + DIALOG_WIDTH, t = parseFloat(frame.style.top), b = t + DIALOG_HEIGHT;
   // console.log(dialogPos);
   const [x0, y0] = dialogPos;
   const l = x0, r = l + DIALOG_WIDTH, t = y0, b = t + DIALOG_HEIGHT;
   const inFrame = l <= x && x <= r && t <= y && y <= b;

   // console.log(inFrame, "(content)");
   // console.log(l, r, t, b)
   // console.log(x, y);
   return inFrame;
}

window.addEventListener('mousemove', (e => {
   const x = e.clientX, y = e.clientY;
   const inFrame = isInFrame(x, y);
   frame.style.pointerEvents = dialogActive && inFrame ? 'auto' : 'none';
   // if (dialogActive && inFrame)
   //    document.body.style.overflow = 'hidden';
}));

// frame.addEventListener('mousemove', e => {
//    const x = e.clientX, y = e.clientY;
//    const inFrame = isInFrame(x, y);
//    frame.style.pointerEvents = inFrame ? 'auto' : 'none';
// })

const frameURL = chrome.runtime.getURL('dialog.html');

const blurEvents: (keyof WindowEventMap)[] = [
   'click',
   // todo: add infinite scroll in card container?
   // 'scroll'
];
for (let name of blurEvents) {
   window.addEventListener(name, e => {
      //console.log('window', name)
      if (frame.style.pointerEvents === 'none')
         frame.contentWindow?.postMessage('close', frameURL);
      else
         e.preventDefault();  // not working for scroll
   })
}

const handler = (msg: TabMessageMap['dialog']['msg']) => {
   const position = getDialogPosition();
   //console.log('dialog')
   frame.contentWindow?.postMessage({ ...msg, position }, frameURL);
}
let ready = false;
// type MessageAction = typeof DIALOG_POSITION | typeof DIALOG_READY;
window.addEventListener('message', (e: MessageEvent<{ action: DialogAction, position: [number, number], active: boolean }>) => {

   function assertUnreachable(x: never): never {
      throw new Error("Didn't expect to get here");
   }

   // console.log("receive message (content): ", e.data);
   if (typeof e.data === 'object' && 'action' in e.data) {
      switch (e.data['action']) {
         case DialogAction.Ready:
            if (!ready) {
               ready = true;
               addMessageListener('dialog', handler)
            }
            break;
         case DialogAction.Position:
            const { position } = e.data;
            dialogPos = position;
            // frame.style.left = `${left}px`;
            // frame.style.top = `${top}px`;
            break;
         case DialogAction.DisablePointer:
            frame.style.pointerEvents = 'none';
            // document.body.style.overflow = 'scroll';
            break;
         case DialogAction.Active:
            const { active } = e.data;
            dialogActive = active;
            break;
         default:
            assertUnreachable(e.data['action']);

      }
   }
})

/* --------------------------------- Submit --------------------------------- */

addMessageListener('submitPage', async (msg, sender) => {
   return await submitPage();
})

/* ------------------------------ Popup Message ----------------------------- */

addMessageListener('snackBar', (msg: ISnackBarProps) => {
   //console.log('add snackBar')
   const root = document.createElement("div");
   createRoot(root).render(
      <React.StrictMode>
         <SnackBar msg={msg.msg} severity={msg.severity} action={msg.action} />
      </React.StrictMode>
   );
   document.body.append(root);
});

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
      //console.log(node, "is inited");
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
         <GradeChartLoader auth={isAuth} title={title == null ? "" : title} course_id1={course_id1 == null ? "" : course_id1} course_id2={course_id2 == null ? "" : course_id2} lecturer={lecturer == null ? "" : lecturer} class_id={class_id == null ? "" : class_id} />
      </React.StrictMode>
   );
   childList.item(childList.length - 1).prepend(root);
   node.setAttribute("inited", "true");
}


async function searchPageFeature() {

   const LIST = "ul.table";
   const ITEM = "li.MuiListItem-root";

   await waitUntil(() => !!document.querySelector(LIST));

   // Check Token
   let token = await getStorage('token');
   const isAuth = (token !== undefined);


   // Check TTL
   let TTL = await getStorage("ttl");
   if ((TTL && TTL.cache_time < Date.now() - TTL.value) || !TTL) {
      const [ttl, _2] = await sendRuntimeMessage("service", {
         funcName: "getTtlTimeToLiveGet",
         args: {},
      });
      if (ttl) {
         await setStorage({
            ttl: { value: ttl * 1000, cache_time: Date.now() },
         });
         // console.log("Set TTL", ttl);
      }
   }

   const optionButton: any = document.querySelectorAll(".mui-tpbkxp")[1];

   if (optionButton) {
      // TODO: restore user option setting
      let hasModified: boolean[] = [false, false, false, false, false, false, false, false, false, false, false]
      optionButton.click()
      await waitUntil(() => !!document.querySelector(".mui-12efj16"));
      const options = document.querySelector(".mui-12efj16")
      options?.childNodes.forEach((option: any, idx) => {
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
               //console.log(`Got ${node.nodeName}, ignored`);
               return;
            }
            initSearchItem(node as HTMLElement, isAuth);
         });
      });
   }
   const ob = new MutationObserver(callback);
   ob.observe(listParent, { childList: true });
}

/* ---------------------------- Register Feature ---------------------------- */

//console.time('snack')

function registerFeature(fn: () => void, pattern: string | RegExp) {
   let previousUrl = "";

   const callback = () => {
      if (window.location.href !== previousUrl) {
         //console.log(`URL changed from ${previousUrl} to ${window.location.href}`);
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
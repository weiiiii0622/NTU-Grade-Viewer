import { createRoot } from "react-dom/client";
import { RequestType, Route, fetchApp } from "./api";
import { FixedBox } from "./components/fixedBox";

type MessageType = "fetch-proxy";
type MessageArgs<T extends Route> = {
   "fetch-proxy": { route: T; req: RequestType[T] };
};

function addMessageListener<T extends MessageType, R extends Route>(
   msgType: T,
   handler: (
      args: MessageArgs<R>[T],
      responseCallback: (res: unknown) => void
   ) => void
) {
   chrome.runtime.onMessage.addListener(
      (msg: { type: MessageType }, sender, sendResponse) => {
         const { type, ...args } = msg;
         console.log(type)
         if (type === msgType) {
            console.log('handle', type)
            handler(args as any, sendResponse);
         }
         return true;
      }
   );
}

addMessageListener("fetch-proxy", async ({ route, req }, sendResponse) => {
   console.log('fetch proxy')
   fetchApp(route, req).then((r) => {
      if (r) sendResponse(r);
   });
});

/* ------------------------------ Context Menu ------------------------------ */

chrome.contextMenus.create(
   {
      type: "normal",
      title: "test",
      id: "test",
      contexts: ["selection"]
   }
);

chrome.contextMenus.onClicked.addListener((info, tab) => {
   console.log(tab)
   chrome.tabs.sendMessage(tab?.id!, 'contextMenu');
})

chrome.tabs.onActivated.addListener((info) => {
   chrome.tabs.get(info.tabId, async (tab) => {
      // ? Avoid chrome:// tabs
      if (tab.url) {
         const CONTENT_RUNNING = "contentScriptRunning";
         const target = { tabId: info.tabId };
         const running = !! await chrome.scripting.executeScript({ target, func: (key) => window.localStorage.getItem(key), args: [CONTENT_RUNNING] })
         if (!running) {
            chrome.scripting.executeScript({
               target, func: (key) => {
                  window.localStorage.setItem(key, 'true');
                  window.addEventListener('close', () => window.localStorage.removeItem(key))
               }, args: [CONTENT_RUNNING]
            })
            chrome.scripting
               .executeScript({
                  target,
                  files: ["js/vendor.js", "js/content_script.js"],
               })
               .then(() => console.log("success"));
         }
      }
   });
});

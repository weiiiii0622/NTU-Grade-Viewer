import { RuntimeMessageService, ServiceFuncName, addMessageListener, sendRuntimeMessage, sendTabMessage } from "./api_v2";
import { DefaultService, OpenAPI } from "./client";



/* ----------------------------- Service Handler ---------------------------- */

OpenAPI['BASE'] = APP_URL

async function serviceHandler<F extends ServiceFuncName>(
   msg: Omit<RuntimeMessageService<F>["msg"], "action">,
   sender: chrome.runtime.MessageSender,
   sendResponse: (response: RuntimeMessageService<F>["response"]) => void
) {
   const { funcName, args } = msg;
   console.log("Sevice: ", funcName)
   const func = DefaultService[funcName];

   const response = await func(...(args as [any]));
   sendResponse(response);
}

console.log('background-v2')

addMessageListener<RuntimeMessageService<ServiceFuncName>, ServiceFuncName>('service', serviceHandler)



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
   sendTabMessage(tab?.id!, { action: 'contextMenu' })
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

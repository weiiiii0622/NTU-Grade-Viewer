import { ServiceFuncName, addMessageListener, getStorage, removeStorage, sendRuntimeMessage, sendTabMessage, setStorage } from "./api_v2";
import { ApiError, DefaultService, OpenAPI } from "./client";

OpenAPI['BASE'] = APP_URL

/* ---------------------------------- Token --------------------------------- */


/* ----------------------------- Service Handler ---------------------------- */



console.log('background-v2')

addMessageListener('service', async (msg, sender) => {
   const { funcName, args } = msg;
   const func = DefaultService[funcName];
   let token = await getStorage('token');
   if (token)
      token = token.replaceAll('=', '%3D')


   try {
      const response = await func({ ...args, xToken: token } as any);

      if ('token' in response) {
         const { token } = response;
         await setStorage({ token })
      }

      return response
   } catch (e) {
      if (e instanceof ApiError) {
         // console.log(e.status)
         return e.status
      }
      else{
         return 'QQ'
         throw 'QQ'
      }
   }
})


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
   sendTabMessage(tab?.id!, 'contextMenu', {})
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

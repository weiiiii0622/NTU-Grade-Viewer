import { ServiceError, addMessageListener, getStorage, sendRuntimeMessage, sendTabMessage, setStorage } from "./api";
import { ApiError, DefaultService, OpenAPI } from "./client";

OpenAPI['BASE'] = APP_URL
//console.log(APP_URL)


// todo: notification, omnibox, commands

/* ---------------------------------- User ---------------------------------- */


addMessageListener('user', async (msg, sender) => {
   const token = await getStorage('token');
   if (!token)
      return null;
   try {
      const user = await DefaultService.getUserUserGet({ token })
      return user
   } catch {
      return null
   }
});

addMessageListener('session_id', async (msg, sender) => {
   
   const _ga = await chrome.cookies.getAll({ domain:'.ntu.edu.tw', name: '_ga' });
   const ASP_NET_SessionId = await chrome.cookies.getAll({ domain: 'if190.aca.ntu.edu.tw', name: 'ASP.NET_SessionId' });
   const TS01c67bb5 = await chrome.cookies.getAll({ domain: '.if190.aca.ntu.edu.tw', name: 'TS01c67bb5' });
   const _ga_X3821T0R42 = await chrome.cookies.getAll({ domain:'.ntu.edu.tw', name: '_ga_X3821T0R42' });
   
   // console.log(_ga);
   // console.log(ASP_NET_SessionId);
   // console.log(TS01c67bb5);
   // console.log(_ga_X3821T0R42);
   
   let cookie = '';
   cookie += `_ga=${_ga.length ? _ga[0].value : ""}; `
   cookie += `ASP.NET_SessionId=${ASP_NET_SessionId.length ? ASP_NET_SessionId[0].value : ""}; `
   cookie += `TS01c67bb5=${TS01c67bb5.length ? TS01c67bb5[0].value : ""}; `
   cookie += `_ga_X3821T0R42=${_ga_X3821T0R42.length ? _ga_X3821T0R42[0].value : ""}; `
   return cookie
});




/* ----------------------------- Service Handler ---------------------------- */



//console.log('background-v2')

addMessageListener('service', async (msg, sender) => {
   //console.log('service')

   const { funcName, args } = msg;

   const func = DefaultService[funcName];
   let token = await getStorage('token');
   if (token)
      token = token.replaceAll('=', '%3D')


   try {
      const response = await func({ ...args, xToken: token } as any);

      if (typeof response === 'object' && 'token' in response) {
         const { token } = response;
         await setStorage({ token })
      }

      return [response, null] as const;
   } catch (e) {
      //console.log("error: ", e)

      if (e instanceof ApiError) {
         //console.log(e.status)
         //console.log(e.body)
         return [null, { status: e.status, response: e.body } as ServiceError] as const;
      }
      else {
         return [null, { status: 400, response: { detail: `UnhandledError: ${e}` } }] as const;
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
      if (!tab.url?.includes("chrome://")) {

         // chrome.action.openPopup({ windowId: tab.windowId })
         // console.log(tab.)

         return;
         const CONTENT_RUNNING = "contentScriptRunning";
         const target = { tabId: info.tabId };
         // const running = !! await chrome.scripting.executeScript({ target, func: (key) => window.localStorage.getItem(key), args: [CONTENT_RUNNING] })
         // if (!running) {
         //    chrome.scripting.executeScript({
         //       target, func: (key) => {
         //          window.localStorage.setItem(key, 'true');
         //          window.addEventListener('close', () => window.localStorage.removeItem(key))
         //       }, args: [CONTENT_RUNNING]
         //    })
         // chrome.scripting
         //    .executeScript({
         //       target,
         //       files: ["js/vendor.js", "js/content_script.js"],
         //    })
         //    .then(() => console.log("success"));
      }
   }
   )
});


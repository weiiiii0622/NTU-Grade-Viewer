import { ServiceError, addMessageListener, getStorage, sendRuntimeMessage, sendTabMessage, setStorage } from "./api";
import { ApiError, DefaultService, OpenAPI } from "./client";
import { injectContentScriptIfNotRunning } from "./utils";

OpenAPI['BASE'] = APP_URL


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

/* ----------------------------- Service Handler ---------------------------- */

addMessageListener('service', async (msg, sender) => {

   const { funcName, args } = msg;

   const func = DefaultService[funcName];
   let token = await getStorage('token');
   if (token)
      token = token.replaceAll('=', '%3D')

   console.log(`service: ${funcName}`)

   try {
      const response = await func({ ...args, xToken: token } as any);

      console.log(`response: ( ${response} )`)

      if (typeof response === 'object' && 'token' in response) {
         const { token } = response;
         await setStorage({ token })
      }

      return [response, null] as const;
   } catch (e) {
      if (e instanceof ApiError) {
         return [null, { status: e.status, response: e.body } as ServiceError] as const;
      }
      else {
         return [null, { status: 400, response: { detail: `UnhandledError: ${e}` } }] as const;
      }
   }
})


/* ---------------------- Inject Script When Activated ---------------------- */


/* ------------------------------ Context Menu ------------------------------ */

// todo: create two context
chrome.contextMenus.create(
   {
      id: "selection",
      type: "normal",
      title: "搜尋 '%s' 的成績分布",
      contexts: ["selection"]
   },
);
chrome.contextMenus.create(
   {
      id: 'all',
      type: 'normal',
      title: `開啟 ${APP_TITLE} 面板`,
      contexts: ['all'],
   }
)

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
   if (tab?.url?.includes("chrome://")) {
      return;
   }

   await injectContentScriptIfNotRunning(tab?.id!)
   // ! fix racing condition
   sendTabMessage(tab?.id!, 'dialog', { selection: info.selectionText ?? '' });
})



// todo: jump to options on installed.
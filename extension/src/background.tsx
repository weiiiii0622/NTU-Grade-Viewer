import { GetResponseType, GetServiceArgs, GetServiceResponse, MessageHandler, RuntimeMessageMap, ServiceError, ServiceFuncName, addMessageListener, getStorage, sendRuntimeMessage, sendTabMessage, setStorage } from "./api";
import { ApiError, DefaultService, OpenAPI } from "./client";
import { QueryGradeBatcher } from "./queryGradeBatcher";
import { serviceHandler } from "./serviceHandler";
import { injectContentScriptIfNotRunning } from "./utils";

OpenAPI['BASE'] = APP_URL

//console.log("background");

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

   const _ga = await chrome.cookies.getAll({ domain: '.ntu.edu.tw', name: '_ga' });
   const ASP_NET_SessionId = await chrome.cookies.getAll({ domain: 'if190.aca.ntu.edu.tw', name: 'ASP.NET_SessionId' });
   const TS01c67bb5 = await chrome.cookies.getAll({ domain: '.if190.aca.ntu.edu.tw', name: 'TS01c67bb5' });
   const _ga_X3821T0R42 = await chrome.cookies.getAll({ domain: '.ntu.edu.tw', name: '_ga_X3821T0R42' });

   //console.log(_ga);
   //console.log(ASP_NET_SessionId);
   //console.log(TS01c67bb5);
   //console.log(_ga_X3821T0R42);

   let cookie = '';
   cookie += `_ga=${_ga.length ? _ga[0].value : ""}; `
   cookie += `ASP.NET_SessionId=${ASP_NET_SessionId.length ? ASP_NET_SessionId[0].value : ""}; `
   cookie += `TS01c67bb5=${TS01c67bb5.length ? TS01c67bb5[0].value : ""}; `
   cookie += `_ga_X3821T0R42=${_ga_X3821T0R42.length ? _ga_X3821T0R42[0].value : ""}; `
   return cookie
});




/* ----------------------------- Service Handler ---------------------------- */


global.batcher = new QueryGradeBatcher();
addMessageListener('service', serviceHandler);


// addMessageListener('service', async (msg, sender) => {

//    const { funcName, args } = msg;

//    const func = DefaultService[funcName];
//    let token = await getStorage('token');
//    if (token)
//       token = token.replaceAll('=', '%3D')

//    console.log(`service: ${funcName}`)

//    try {
//       // const response = funcName === 'queryGradesQueryGet'
//       //    ? await batcher.addTask(args)
//       //    : await func({ ...args, xToken: token } as any);


//       if (funcName === 'queryGradesQueryGet')
//          console.log(args, await batcher.addTask(args));
//       const response = funcName === 'queryGradesQueryGet'
//       await func({ ...args, xToken: token } as any);

//       console.log(`response: ( ${response} )`)

//       if (typeof response === 'object' && 'token' in response) {
//          const { token } = response;
//          await setStorage({ token })
//       }

//       return [response, null] as const;
//    } catch (e) {
//       if (e instanceof ApiError) {
//          return [null, { status: e.status, response: e.body } as ServiceError] as const;
//       }
//       else {
//          return [null, { status: 400, response: { detail: `UnhandledError: ${e}` } }] as const;
//       }
//    }
// })


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
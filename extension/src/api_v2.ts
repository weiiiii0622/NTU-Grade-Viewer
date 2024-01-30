import { DefaultService } from "./client";
import { ClassMethodName, Equal, IsTrue, NotEqual } from "./utilTypes";

console.log("api-v2");

/* -------------------------------------------------------------------------- */
/*                               Message Passing                              */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Tab Message ------------------------------ */

type TabMessageContextMenu = {
   msg: {
      action: "contextMenu";
   };
   response: undefined;
};

type TabMessageSubmit = {
   msg: {
      action: "submitPage";
   };
   response: { data: unknown; status: number } | string;
};

type TabMessage = TabMessageContextMenu | TabMessageSubmit;
export type { TabMessage, TabMessageContextMenu, TabMessageSubmit };

export async function sendTabMessage<M extends TabMessage>(
   tabId: number,
   msg: M["msg"]
): Promise<M["response"]> {
   return await chrome.tabs.sendMessage<M["msg"], M["response"]>(tabId, msg);
}

/* ----------------------------- Runtime Message ---------------------------- */

type ServiceFuncName = ClassMethodName<typeof DefaultService>;

export type { ServiceFuncName };

type RuntimeMessageService<F extends ServiceFuncName> = {
   msg: {
      action: "service";
      funcName: F;
      args: Parameters<(typeof DefaultService)[F]>;
   };
   response: ReturnType<(typeof DefaultService)[F]>;
};

type RuntimeMessage<F extends ClassMethodName<typeof DefaultService>> = RuntimeMessageService<F>;

export type { RuntimeMessage, RuntimeMessageService };

async function sendRuntimeMessage<
   M extends RuntimeMessage<F>,
   F extends ClassMethodName<typeof DefaultService>
>(msg: M["msg"]): Promise<M["response"]> {
   return await chrome.runtime.sendMessage<M["msg"], M["response"]>(msg);
}

export { sendRuntimeMessage };

/* ---------------------------- Message Listener ---------------------------- */

export function addMessageListener<
   M extends RuntimeMessage<F> | TabMessage,
   F extends ClassMethodName<typeof DefaultService>
>(
   action: M["msg"]["action"],
   handler: (
      msg: Omit<M["msg"], "action">,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: M["response"]) => void
   ) => void
) {
   chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      const { action: _action, ...payload } = msg;
      if (action === _action) {
         handler(payload, sender, sendResponse);
      }
      return true; // not sure if is necessary
   });
}

/* -------------------------------------------------------------------------- */
/*                                   Storage                                  */
/* -------------------------------------------------------------------------- */

function getStorage() {}

function setStorage() {}

import {
   BadRequestResponse,
   CourseBase,
   DefaultService,
   InternalErrorResponse,
   Page,
   UnauthorizedErrorResponse,
   ValidationErrorResponse,
} from "./client";
import { ClassMethodName, Equal, Expect, IndexFromUnion, ObjectToEntriesTuple } from "./utilTypes";
import { waitUntil, waitUntilAsync } from "./utils";

/* -------------------------------------------------------------------------- */
/*                               Message Passing                              */
/* -------------------------------------------------------------------------- */

type A = { a: 1 } extends { a?: 1 } ? 1 : 2;

type GetResponseType<M extends { msg: unknown; response: unknown }, P> = M extends M
   ? P extends M["msg"]
      ? M["response"]
      : never
   : "never";

/* ------------------------------- Tab Message ------------------------------ */

export type TabListenerState = "pending" | "ready";

type TabMessageMap = {
   dialog: {
      msg: { selection: string };
      response: void;
   };
   submitPage: {
      msg: {};
      response: GetFuncMessage<"submitPageSubmitPagePost">["response"];
   };
   snackBar: {
      msg: {};
      response: void;
   };
};
type TabAction = keyof TabMessageMap;
export type { TabMessageMap, TabAction };

function isTabAction(action: string): action is TabAction {
   // ? this is for type-safety, not missing actions
   const actionMap: Record<TabAction, 0> = {
      dialog: 0,
      snackBar: 0,
      submitPage: 0,
   };
   return Object.keys(actionMap).indexOf(action) !== -1;
}

async function getTabListenerState(tabId: number, action: TabAction): Promise<TabListenerState> {
   const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (action: TabAction) => {
         const indicator = window.NTU_GRADE_VIEWER__APP_INDICATOR;
         // console.log("in:", indicator, indicator?.getAttribute(action));
         if (!indicator) return "pending";
         return (indicator.getAttribute(action) as TabListenerState) ?? "pending";
      },
      args: [action],
   });
   return result!;
}

export async function sendTabMessage<
   T extends TabAction,
   M extends TabMessageMap[T],
   P extends M["msg"]
>(tabId: number, action: T, msg: P): Promise<GetResponseType<M, P>> {
   console.log(`send ${action}: ${msg}`);
   try {
      await waitUntilAsync(async () => (await getTabListenerState(tabId, action)) === "ready", 30);
      getTabListenerState(tabId, action).then(console.warn);
      return await chrome.tabs.sendMessage<any, GetResponseType<M, P>>(tabId, { msg, action });
   } catch (e) {
      console.log("error: ", e);
      throw `No message listener on ${action} for tab ${tabId}!`;
   }
}

/* ----------------------------- Runtime Message ---------------------------- */

export type ServiceFuncName = ClassMethodName<typeof DefaultService>;

export type ServiceError =
   | { status: 400; response: BadRequestResponse }
   | { status: 401; response: UnauthorizedErrorResponse }
   | { status: 422; response: ValidationErrorResponse }
   | { status: 500; response: InternalErrorResponse };

type OneOf<T, P> = readonly [T, null] | readonly [null, P];

type GetFuncMessage<F extends ServiceFuncName> = {
   msg: {
      funcName: F;
      args: Omit<Parameters<(typeof DefaultService)[F]>[0], "xToken" | "cookieToken">;
   };
   response: OneOf<Awaited<ReturnType<(typeof DefaultService)[F]>>, ServiceError>;
};

type RuntimeMessageServiceMap<F extends ServiceFuncName = ServiceFuncName> = F extends F
   ? { service: GetFuncMessage<F> }
   : "never";

type RuntimeMessageMap = RuntimeMessageServiceMap & {
   user: {
      msg: undefined;
      response: null | Awaited<ReturnType<typeof DefaultService.getUserUserGet>>;
   };
   session_id: {
      msg: undefined;
      response: string;
   };
};
type RuntimeAction = keyof RuntimeMessageMap;

export type { RuntimeMessageMap, RuntimeMessageServiceMap };

async function sendRuntimeMessage<
   T extends RuntimeAction,
   M extends RuntimeMessageMap[T],
   P extends M["msg"]
>(action: T, msg: P): Promise<GetResponseType<M, P>> {
   return await chrome.runtime.sendMessage<any, GetResponseType<M, P>>({ msg, action });
}

export { sendRuntimeMessage };

/* ---------------------------- Message Listener ---------------------------- */

type MessageMap = TabMessageMap | RuntimeMessageMap;
type Action = TabAction | RuntimeAction;

const listenerMap: Map<Action, Map<any, any>> = new Map();

export function addMessageListener<
   T extends Action,
   M extends IndexFromUnion<MessageMap, T>,
   P extends M["msg"]
>(
   action: T,
   handler: (
      msg: P,
      sender: chrome.runtime.MessageSender
   ) => GetResponseType<M, P> | Promise<GetResponseType<M, P>>
) {
   // @ts-ignore
   const _handler = (_msg, sender, sendResponse) => {
      const { action: _action, msg } = _msg;
      if (action === _action) {
         // * Note: cannot use await since we have to return true first
         const p = handler(msg, sender); // Promise or result
         Promise.resolve(p).then((r) => {
            sendResponse(r);
         });
         return true; // ! it is necessary, to tell chrome `sendResponse` will be called asyncly
      }
   };

   chrome.runtime.onMessage.addListener(_handler);

   // console.log(handler);
   if (isTabAction(action)) {
      // console.log(`action ${action} is tab action`);
      window.NTU_GRADE_VIEWER__APP_INDICATOR.setAttribute(action, "ready");
   }

   if (!listenerMap.get(action)) listenerMap.set(action, new Map());
   listenerMap.get(action)?.set(handler, _handler);
}

export function removeMessageListener<
   T extends Action,
   M extends IndexFromUnion<MessageMap, T>,
   P extends M["msg"]
>(
   action: T,
   handler: (
      msg: P,
      sender: chrome.runtime.MessageSender
   ) => GetResponseType<M, P> | Promise<GetResponseType<M, P>>
) {
   try {
      const _handler = listenerMap.get(action)?.get(handler);
      chrome.runtime.onMessage.removeListener(_handler);
   } catch {}
}

/* ---------------------------------- Test ---------------------------------- */

async function test() {
   const x1 = await sendTabMessage(0, "dialog", { selection: "" });
   type A1 = typeof x1;

   const x2 = await sendTabMessage(0, "submitPage", {});
   type A2 = typeof x2;

   // @ts-expect-error
   sendRuntimeMessage("service", { funcName: "submitPagePagePost", args: [] });
   const [x3, e3] = await sendRuntimeMessage("service", {
      funcName: "submitPageSubmitPagePost",
      args: { requestBody: 0 as any as Page, cookie: "" },
   });
   if (!x3) return;
   type A3 = typeof x3;

   const [x4, e4] = await sendRuntimeMessage("service", {
      funcName: "queryGradesQueryGet",
      args: { id1: "CSIE8888" },
   });
   if (!x4) return;
   type A4 = typeof x4;

   type cases = [
      Expect<Equal<A1, TabMessageMap["dialog"]["response"]>>,
      Expect<Equal<A2, TabMessageMap["submitPage"]["response"]>>,
      Expect<Equal<A3, Awaited<ReturnType<typeof DefaultService.submitPageSubmitPagePost>>>>,
      Expect<Equal<A4, Awaited<ReturnType<typeof DefaultService.queryGradesQueryGet>>>>
   ];

   addMessageListener("dialog", async (msg) => {
      type A = Expect<Equal<typeof msg, TabMessageMap["dialog"]["msg"]>>;
      return 1 as any as TabMessageMap["dialog"]["response"];
   });

   addMessageListener("submitPage", async (msg) => {
      type A = Expect<Equal<typeof msg, TabMessageMap["submitPage"]["msg"]>>;
      return 1 as any as TabMessageMap["submitPage"]["response"];
   });

   addMessageListener("service", async (msg) => {
      type A = Expect<Equal<typeof msg, RuntimeMessageMap["service"]["msg"]>>;
      const { funcName, args } = msg;
      return DefaultService[funcName](args as any);
   });
}

/* -------------------------------------------------------------------------- */
/*                                   Storage                                  */
/* -------------------------------------------------------------------------- */

export type History = {
   courseId1: CourseBase["id1"];
   timeStamp: number; // generated by Date.now()
};
export type StorageMap = {
   token: string;
   ttl: { value: number; cache_time: number }; // in second
   semester: string;
   foo: number;
   histories: History[];
};

export type StorageKey = keyof StorageMap;
type StorageKeyTuple<T extends StorageKey[] = [], L = ObjectToEntriesTuple<StorageMap>["length"]> =
   | (T["length"] extends L ? T : StorageKeyTuple<[...T, StorageKey]>)
   | T;

type StorageKeyTupleReturnType<T extends StorageKey[]> = T extends [
   infer F extends StorageKey,
   ...infer R extends StorageKey[]
]
   ? { [K in F]?: StorageMap[K] } & StorageKeyTupleReturnType<R>
   : {};

function getStorage<T extends StorageKey>(key: T): Promise<StorageMap[T] | undefined>;
async function getStorage(key: StorageKey) {
   // console.log("get storage: ", key);
   return (await chrome.storage.sync.get(key))[key];
}

function getStorages<T extends StorageKeyTuple>(key: T): Promise<StorageKeyTupleReturnType<T>>;
function getStorages<T extends Partial<StorageMap>>(
   key: T
): Promise<{ [K in keyof T]: K extends keyof StorageMap ? StorageMap[K] : "never" }>;
async function getStorages(keys: StorageKey[] | { [K in StorageKey]?: StorageMap[K] }) {
   // console.log("get storages: ", keys);

   return await chrome.storage.sync.get(keys);
}

type StorageChangeHandler<K extends StorageKey> = (data: StorageMap[K] | undefined) => void;

const onStoreChangeMap: { [K in StorageKey]: Set<StorageChangeHandler<K>> } = {
   foo: new Set(),
   token: new Set(),
   histories: new Set(),
   ttl: new Set(),
   semester: new Set(),
};

async function setStorage(items: Partial<StorageMap>) {
   console.log("set storage:", items);
   await chrome.storage.sync.set(items);

   (Object.keys(items) as StorageKey[]).forEach((key) => {
      onStoreChangeMap[key].forEach((fn) => fn(items[key] as any));
   });
}

async function removeStorage<T extends StorageKey>(key: T) {
   console.log(`remove storage: ${key}`);
   await chrome.storage.sync.remove(key);

   onStoreChangeMap[key].forEach((fn) => fn(undefined));
}

async function removeStorages<T extends StorageKeyTuple>(keys: T) {
   console.log(`remove storages: ${keys}`);
   chrome.storage.sync.remove(keys);

   keys.forEach((key) => {
      onStoreChangeMap[key].forEach((fn) => fn(undefined));
   });
}

export function subscribeFactory<K extends StorageKey>(
   key: K
): (onStoreChange: StorageChangeHandler<K>) => () => void {
   const subscribe = (fn: StorageChangeHandler<K>) => {
      onStoreChangeMap[key].add(fn);
      return () => onStoreChangeMap[key].delete(fn);
   };
   return subscribe;
}

export { getStorage, getStorages, setStorage, removeStorage, removeStorages };

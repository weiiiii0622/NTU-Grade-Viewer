import {
   BadRequestResponse,
   DefaultService,
   InternalErrorResponse,
   Page,
   PageResponse,
   UnauthorizedErrorDetail,
   UnauthorizedErrorResponse,
   ValidationErrorDetail,
   ValidationErrorResponse,
} from "./client";
import {
   ClassMethodName,
   Equal,
   Expect,
   IndexFromUnion,
   IsTrue,
   NotEqual,
   ObjectToEntriesTuple,
   UnionToTuple,
} from "./utilTypes";

// console.log("api-v2");

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

type TabMessageMap = {
   contextMenu: {
      msg: {};
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

export async function sendTabMessage<
   T extends TabAction,
   M extends TabMessageMap[T],
   P extends M["msg"]
>(tabId: number, action: T, msg: P): Promise<GetResponseType<M, P>> {
   return await chrome.tabs.sendMessage<any, GetResponseType<M, P>>(tabId, { msg, action });
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
   chrome.runtime.onMessage.addListener((_msg, sender, sendResponse) => {
      const { action: _action, msg } = _msg;
      if (action === _action) {
         // * Note: cannot use await since we have to return true first
         const p = handler(msg, sender); // Promise or result
         Promise.resolve(p).then((r) => {
            //console.log(action, msg, r);

            sendResponse(r);
         });
         return true; // ! it is necessary, to tell chrome `sendResponse` will be called asyncly
      }
   });
}

/* ---------------------------------- Test ---------------------------------- */

async function test() {
   const x1 = await sendTabMessage(0, "contextMenu", {});
   type A1 = typeof x1;

   const x2 = await sendTabMessage(0, "submitPage", {});
   type A2 = typeof x2;

   // @ts-expect-error
   sendRuntimeMessage("service", { funcName: "submitPagePagePost", args: [] });
   const [x3, e3] = await sendRuntimeMessage("service", {
      funcName: "submitPageSubmitPagePost",
      args: { requestBody: 0 as any as Page },
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
      Expect<Equal<A1, TabMessageMap["contextMenu"]["response"]>>,
      Expect<Equal<A2, TabMessageMap["submitPage"]["response"]>>,
      Expect<Equal<A3, Awaited<ReturnType<typeof DefaultService.submitPageSubmitPagePost>>>>,
      Expect<Equal<A4, Awaited<ReturnType<typeof DefaultService.queryGradesQueryGet>>>>
   ];

   addMessageListener("contextMenu", async (msg) => {
      type A = Expect<Equal<typeof msg, TabMessageMap["contextMenu"]["msg"]>>;
      return 1 as any as TabMessageMap["contextMenu"]["response"];
   });

   addMessageListener("submitPage", async (msg) => {
      type A = Expect<Equal<typeof msg, TabMessageMap["contextMenu"]["msg"]>>;
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

type StorageMap = {
   token: string;
   foo: number;
};
type StorageKey = keyof StorageMap;
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
   return (await chrome.storage.sync.get(key))[key];
}

function getStorages<T extends StorageKeyTuple>(key: T): Promise<StorageKeyTupleReturnType<T>>;
function getStorages<T extends Partial<StorageMap>>(
   key: T
): Promise<{ [K in keyof T]: K extends keyof StorageMap ? StorageMap[K] : "never" }>;
async function getStorages(keys: StorageKey[] | { [K in StorageKey]?: StorageMap[K] }) {
   return await chrome.storage.sync.get(keys);
}

async function setStorage(items: Partial<StorageMap>) {
   // console.log("set storage:", items);
   await chrome.storage.sync.set(items);
}

async function removeStorage<T extends StorageKey>(key: T) {
   await chrome.storage.sync.remove(key);
   // console.log('remove success')
}

async function removeStorages<T extends StorageKeyTuple>(keys: T) {
   chrome.storage.sync.remove(keys);
}

export { getStorage, getStorages, setStorage, removeStorage, removeStorages };

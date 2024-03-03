
/* --------------------------------- Message -------------------------------- */

import { GetResponseType, GetServiceArgs, GetServiceResponse, MessageHandler, RuntimeMessageMap, ServiceError, ServiceFuncName, TabAction, TabListenerState, TabMessageMap, addMessageListener, sendRuntimeMessage, sendTabMessage } from "./message";
import { History, StorageKey, StorageMap, getStorage, getStorages, removeStorage, removeStorages, setStorage, subscribeFactory } from "./storage";

export type { ServiceFuncName, GetServiceArgs, GetServiceResponse, ServiceError };
export type { TabListenerState };
export type { TabAction, TabMessageMap, GetResponseType, RuntimeMessageMap, MessageHandler };
export { sendRuntimeMessage, sendTabMessage, addMessageListener };

/* --------------------------------- Storage -------------------------------- */

export type { StorageKey, StorageMap, History };
export { getStorage, getStorages, setStorage, removeStorage, removeStorages, subscribeFactory };


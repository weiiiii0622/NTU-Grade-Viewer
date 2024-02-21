import { TabMessageMap } from "../api";
import { DialogAction } from "../config";

// export type DialogMessage = TabMessageMap["dialog"]["msg"];
export type DialogMessage = { selection: string; position: [number, number] };
export function addDialogMessageHandler(handler: (msg: DialogMessage) => void): () => void {
   console.log("add dialog");
   const f = (e: MessageEvent<DialogMessage>) => {
      console.log("receive message (frame): ", e.data);
      handler(e.data);
   };
   window.addEventListener("message", f);

   console.log("send message from ", window.location.href);
   window.parent.postMessage({ action: DialogAction.Ready }, document.referrer);

   return () => window.removeEventListener("message", f);
}

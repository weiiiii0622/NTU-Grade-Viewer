

// from iframe to content
// export enum DialogAction {
//     Ready,
//     Position,
//     DisablePointer,
//     Active,
// }

import { Vec2 } from "../utils";

export type DialogMessageMap = {
    selection: string;
    position: Vec2;
    close: undefined;
}
export type DialogAction = keyof DialogMessageMap;
export type DialogMessage = { selection: string; position: [number, number] } | "close";
export function addDialogMessageHandler(handler: (msg: DialogMessage) => void): () => void {
    //console.log("add dialog");
    const f = (e: MessageEvent<DialogMessage>) => {
        //console.log("receive message (frame): ", e.data);
        handler(e.data);
    };
    window.addEventListener("message", f);

    //console.log("send message from ", window.location.href);
    // console.log("to ", document.referrer || "*");
    // window.parent.postMessage({ action: DialogAction.Ready }, "*");

    return () => window.removeEventListener("message", f);
}

/* --------------------------------- Content -------------------------------- */

export type ContentMessageMap = {
    ready: undefined;
    position: Vec2;
    disablePointer: undefined;
    active: boolean;
};
export function sendContentMessage<T extends keyof ContentMessageMap>(
    action: T,
    args: ContentMessageMap[T]
) {
    const referrer = document.referrer || '*';
    window.parent.postMessage({ action, args }, referrer);
}
export function addContentMessageListener<T extends keyof ContentMessageMap>(
    _action: T,
    handler: (
        args: ContentMessageMap[T]
    ) => void
) {

    const f = (e: MessageEvent<{ action: T, args: ContentMessageMap[T] }>) => {
        //console.log("receive message (content): ", e.data);
        const { action, args } = e.data;
        if (action === _action)
            handler(args);
    };
    window.addEventListener("message", f);
    return () => window.removeEventListener('message', f);
}

/* ---------------------------------- Frame --------------------------------- */

export type FrameMessageMap = {
    open: {
        selection: string;
        position: Vec2;
    }
    close: undefined;
};
export function sendFrameMessage<T extends keyof FrameMessageMap>(
    frame: HTMLIFrameElement,
    action: T,
    args: FrameMessageMap[T]
) {
    const frameURL = chrome.runtime.getURL('dialog.html');
    frame.contentWindow?.postMessage({ action, args }, frameURL);
}
export function addFrameMessageListener<T extends keyof FrameMessageMap>(
    _action: T,
    handler: (
        args: FrameMessageMap[T]
    ) => void
) {
    const f = (e: MessageEvent<{ action: T, args: FrameMessageMap[T] }>) => {
        //console.log("receive message (frame): ", e.data);
        const { action, args } = e.data;
        if (action === _action)
            handler(args);
    };
    window.addEventListener("message", f);
    return () => window.removeEventListener('message', f);
}



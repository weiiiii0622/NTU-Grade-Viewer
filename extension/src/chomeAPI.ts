// This module provide type-safe wrapper for chrome api whose type definition includes `any`.

/* ------------------------------- Tab Message ------------------------------ */

type TabMessageFoo = {
    msg: {
        action: "foo";
        payload: number;
    };
    response: string;
};

type TabMessage = TabMessageFoo;

async function sendTabMessage<M extends TabMessage>(
    tabId: number,
    msg: M["msg"]
): Promise<M["response"]> {
    return await chrome.tabs.sendMessage<M["msg"], M["response"]>(tabId, msg);
}

/* ----------------------------- Runtime Message ---------------------------- */

type RuntimeMessageFoo = {
    msg: {
        action: "foo";
        payload: number;
    };
    response: string;
};

type RuntimeMessage = RuntimeMessageFoo;

async function sendRuntimeMessage<M extends RuntimeMessage>(msg: M["msg"]): Promise<M["response"]> {
    return await chrome.runtime.sendMessage<M["msg"], M["response"]>(msg);
}

/* ---------------------------- Message Listener ---------------------------- */

function addMessagerListener<M extends RuntimeMessage | TabMessage>(
    handler: (
        msg: M["msg"],
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: M["response"]) => void
    ) => void
) {
    chrome.runtime.onMessage.addListener(handler);
}

/* --------------------------------- Storage -------------------------------- */

function getStorage() {}

function setStorage() {}

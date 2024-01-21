import { RequestType, Route, fetchApp } from "./api";

function polling() {
    // console.log("polling");
    setTimeout(polling, 1000 * 30);
}

polling();

type MessageType = "proxy-service" | "fetch-proxy";
type MessageArgs<T extends Route> = {
    "proxy-service": { func: (...args: unknown[]) => void; args: unknown[] };
    "fetch-proxy": { route: T; req: RequestType[T] };
};

function addMessageListener<T extends MessageType, R extends Route>(
    msgType: T,
    handler: (args: MessageArgs<R>[T], responseCallback: (res: unknown) => void) => void
) {
    chrome.runtime.onMessage.addListener((msg: { type: MessageType }, sender, sendResponse) => {
        const { type, ...args } = msg;
        console.log(msg);
        if (type === msgType) {
            console.log("add: ", msg, args);
            handler(args as any, sendResponse);
        }
        return true;
    });
}

addMessageListener("fetch-proxy", async ({ route, req }, sendResponse) => {
    fetchApp(route, req).then((r) => {
        if(r)
        sendResponse(r);
    });
});

// addMessageListener("proxy-service", ({ func, args }, callback) => {
//     console.log(func, args)
//     callback(func(args));
// });

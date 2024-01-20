function polling() {
    // console.log("polling");
    setTimeout(polling, 1000 * 30);
}

polling();

type MessageType = "proxy-service";
type MessageArgs = {
    "proxy-service": { func: (...args: unknown[]) => void; args: unknown[] };
};

function addMessageListener<T extends MessageType>(
    msgType: T,
    handler: (args: MessageArgs[T], responseCallback: (res: unknown) => void) => void
) {
    chrome.runtime.onMessage.addListener((msg: { type: MessageType }, sender, sendResponse) => {
        const { type, ...args } = msg;
        if (type === msgType) {
            handler(args as any, sendResponse);
        }
    });
}

addMessageListener("proxy-service", ({ func, args }, callback) => {
    callback(func(args));
});

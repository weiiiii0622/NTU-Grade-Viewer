import { Page } from "./models";

interface RoutePage {
    method: "POST";
    body: Page;
}

interface RouteFoo {
    method: "GET";
}

type Route = "/page" | "/foo";
type RequestType = { "/foo": RouteFoo; "/page": RoutePage };
type ResponseSuccess = {
    "/foo": number;
    "/page": { userId: string };
};
type ResponseFail = {};
type ResponseType = {
    [K in keyof ResponseSuccess]:
        | { status: "success"; data: ResponseSuccess[K] }
        | { status: "fail"; data: unknown };
};

export type { Route, RequestType, ResponseSuccess };

/**
 * Send request to web app. This should be executed at background in general.
 *
 * @param route
 * @param req
 * @returns
 */
async function fetchApp<T extends Route>(route: T, req: RequestType[T]): Promise<ResponseType[T]> {
    const { method } = req;

    let body: string | undefined = undefined;
    if (method === "POST") body = JSON.stringify(req.body);

    const headers = method === "POST" ? { "content-type": "application/json" } : undefined;

    const url = APP_URL + route;

    const res: ResponseType[T] = await fetch(url, {
        body,
        headers,
        method,
    }).then(async (r) => {
        if (r.status >= 500) return { status: "fail", data: "Internal Server Error" };
        if (r.status >= 400) return { status: "fail", data: await r.json() };
        return { status: "success", data: await r.json() };
    });

    return res;
}

async function fetchAppProxy<T extends Route>(
    route: T,
    req: RequestType[T]
): Promise<ResponseType[T]> {
    return new Promise((res) => {
        chrome.runtime.sendMessage({ type: "fetch-proxy", route, req }, (r) => {
            res(r);
        });
    });
}

export { fetchApp, fetchAppProxy };

// ? This do not work since function cannot be sent as message.
/**
 * Execute function through service worker.
 **/
// function setProxyFunc<T extends any[], R>(
//     func: (...args: T) => R,
//     args?: T,
//     callback?: (result: R) => void
// ) {
//     chrome.runtime.sendMessage({ type: "proxy-service", func, args }, callback);
// }

// export { setProxyFunc };

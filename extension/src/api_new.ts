import { Page } from "./models";
import { toURLQueryString } from "./utils";

interface RoutePage {
    path: "/page";
    options: {
        method: "POST";
        body: Page;
    };
    response: { userId: string };
}

interface RouteExample {
    path: `/example1` | `/example2/${string}`;
    options: {
        method: "GET";
        query: {
            a: number;
            b: string;
        };
    };
    response: [number, string];
}

type Route = RoutePage | RouteExample;
type ResponseType<R extends Route> =
    | { status: "success"; data: R["response"]; status_code: number }
    | { status: "fail"; data: unknown; status_code: number };

export type { Route, ResponseType };

/**
 * Send request to web app. This should be executed at background in general.
 *
 * @param path
 * @param req
 * @returns
 */
async function fetchApp<R extends Route>(
    path: R["path"],
    options: R["options"]
): Promise<ResponseType<R>> {
    const { method } = options;

    let queryString = "";
    if ("query" in options) queryString = "?" + toURLQueryString(options.query);

    let body: string | undefined = undefined;
    if ("body" in options) body = JSON.stringify(options.body);

    const headers = method === "POST" ? { "content-type": "application/json" } : undefined;
    const url = APP_URL + path + queryString;

    const res: ResponseType<R> = await fetch(url, {
        body,
        headers,
        method,
    }).then(async (r) => {
        if (r.status >= 500)
            return {
                status: "fail",
                status_code: r.status,
                data: "Internal Server Error",
            };
        if (r.status >= 400) return { status: "fail", status_code: r.status, data: await r.json() };
        return { status: "success", status_code: r.status, data: await r.json() };
    });

    return res;
}

async function fetchAppProxy<R extends Route>(
    path: R["path"],
    options: R["options"]
): Promise<ResponseType<R>> {
    return new Promise((res) => {
        chrome.runtime.sendMessage({ type: "fetch-proxy", path, options }, (r) => {
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

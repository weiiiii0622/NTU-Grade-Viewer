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
type ResponseType = { "/foo": number; "/page": {} };

async function fetchApp<T extends Route>(route: T, req: RequestType[T]): Promise<ResponseType[T]> {
    const { method } = req;

    let body: string | undefined = undefined;
    if (method === "POST") body = JSON.stringify(req.body);

    const headers = method === "POST" ? { "content-type": "application/json" } : undefined;

    const url = APP_URL + route;

    const res = fetch(url, {
        body,
        headers,
        method,
    }).then((r) => r.json());

    return res as any;
}

export { fetchApp };

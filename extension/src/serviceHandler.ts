import {
    GetServiceArgs,
    GetServiceResponse,
    ServiceError,
    ServiceFuncName,
    getStorage,
    setStorage,
} from "./api";
import { ApiError, DefaultService } from "./client";

// const batcher = new QueryGradeBatcher();

export async function serviceHandler<F extends ServiceFuncName>(
    msg: { funcName: F; args: GetServiceArgs<F> },
    sender: chrome.runtime.MessageSender | null
): Promise<GetServiceResponse<F>> {
    const { funcName, args } = msg;

    const func = DefaultService[funcName];
    let token = await getStorage("token");
    if (token) token = token.replaceAll("=", "%3D");

    // console.log(`service: ${funcName}`);

    try {
        if (funcName === "queryGradesQueryGet") return (await batcher.addTask(args)) as any;

        const response = await func({ ...args, xToken: token } as any);

        if (typeof response === "object" && "token" in response) {
            const { token } = response;
            await setStorage({ token });
        }

        return [response, null] as const;
    } catch (e) {
        if (e instanceof ApiError) {
            return [null, { status: e.status, response: e.body } as ServiceError] as const;
        } else {
            return [null, { status: 400, response: { detail: `UnhandledError: ${e}` } }] as const;
        }
    }
}

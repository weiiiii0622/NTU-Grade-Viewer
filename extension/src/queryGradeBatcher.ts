import { GetServiceArgs, GetServiceResponse, getStorage, sendRuntimeMessage } from "./api";
import { DefaultService } from "./client";
import { serviceHandler } from "./serviceHandler";

type QueryService = "queryGradesQueryGet";
type QueryResponse = Awaited<ReturnType<(typeof DefaultService)[QueryService]>>;

type Task = {
    resolve: (res: GetServiceResponse<QueryService>) => void;
    args: GetServiceArgs<QueryService>;
};

const TIMEOUT = 100; // ms

export class QueryGradeBatcher {
    private queue: Task[];
    private timeout: number;

    private curTimeoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(timeout = TIMEOUT) {
        this.queue = [];
        this.timeout = timeout;
    }

    async dispatch() {
        if (!this.queue.length) return;

        const queue = this.queue;
        this.queue = []; // clear queue => no duplicate

        let xToken = await getStorage("token");
        if (xToken) xToken = xToken.replaceAll("=", "%3D");
        const requestBody = queue.map((task) => task.args);

        // console.log(`dispatch (${queue.length})`);
        // console.log(requestBody.length === queue.length, queue);

        const [res, err] = await serviceHandler(
            {
                funcName: "queryGradesBatchQueryBatchPost",
                args: { requestBody },
            },
            null
        );

        if (err) {
            queue.forEach(({ resolve }) => {
                resolve([null, err]);
            });
            return;
        }

        for (let i = 0; i < queue.length; i++) {
            queue[i].resolve([res[i], null]);
        }
    }

    async addTask(args: GetServiceArgs<QueryService>): Promise<GetServiceResponse<QueryService>> {
        return new Promise<GetServiceResponse<QueryService>>((res) => {
            this.queue.push({
                resolve: res,
                args,
            });

            if (this.curTimeoutId) clearTimeout(this.curTimeoutId);
            this.curTimeoutId = setTimeout(() => {
                this.dispatch();
            }, this.timeout);
        });
    }
}

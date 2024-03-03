import { History } from "../api";
import { CourseBase } from "../client";
import { DialogAction } from "./config";

// export type DialogMessage = TabMessageMap["dialog"]["msg"];
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
    window.parent.postMessage({ action: DialogAction.Ready }, "*");

    return () => window.removeEventListener("message", f);
}

export type ContentMessageMap = {};
export function sendContentMessage<T extends keyof ContentMessageMap>(
    action: T,
    args: ContentMessageMap[T]
) { }

export type FrameMessageMap = {};
export function sendFrameMessage<T extends keyof FrameMessageMap>(
    action: T,
    args: FrameMessageMap[T]
) { }

export const findHistory = (course: CourseBase, histories: History[]) =>
    histories.find((h) => h.course.id1 === course.id1);
export const isRecent = (course: CourseBase, histories: History[]) =>
    !!findHistory(course, histories);

export function getSortedCourses<T extends CourseBase>(courses: T[], histories: History[]): T[] {
    const cmp = (a: CourseBase, b: CourseBase) => {
        // sort asending by cmp
        // => first from recent (by negative timeStamp), then by title
        function timeStampWeight(course: CourseBase) {
            const history = findHistory(course, histories);
            return history ? -history.timeStamp : 0;
        }
        return a.title.length - b.title.length + 100 * (timeStampWeight(a) - timeStampWeight(b));
    };
    return courses.sort(cmp);
}

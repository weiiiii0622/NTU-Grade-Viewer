import { History } from "../api";
import { CourseBase } from "../client";
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

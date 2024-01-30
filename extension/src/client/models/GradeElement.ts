/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Segment } from './Segment';
/**
 * Grade element stored in db and consumed by client. The values are between 0~100.
 */
export type GradeElement = {
    course_id1: string;
    semester: any[];
    lecturer: (string | null);
    class_id: (string | null);
    segments: Array<Segment>;
    id?: number;
};


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GradeBase = {
    /**
     *
     * This id is hashed from course, semester and class_id.
     * You should set id=-1 to let server compute it.
     *
     */
    id?: (number | null);
    /**
     * '課號', e.g. 'CSIE1212'
     */
    course_id1: string;
    /**
     * '課程識別碼', e.g. '902 10750'. Note the space character.
     */
    course_id2: string;
    /**
     * Semester between 90-1 ~ 130-2
     */
    semester: string;
    /**
     * '班次'
     */
    class_id?: string;
    /**
     * The lecturer.
     */
    lecturer?: string;
};


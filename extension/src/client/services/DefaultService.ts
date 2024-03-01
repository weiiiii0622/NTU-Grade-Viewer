/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseReadWithGrade } from '../models/CourseReadWithGrade';
import type { CourseSuggestion } from '../models/CourseSuggestion';
import type { GradeElement } from '../models/GradeElement';
import type { GradeWithUpdate } from '../models/GradeWithUpdate';
import type { IssueData } from '../models/IssueData';
import type { Page } from '../models/Page';
import type { PageResponse } from '../models/PageResponse';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Query Grades
     * @auth_required
     *
     * Each query should provide at least one of `id1`, `id2` or `title`. The `class_id` and `semester` parameters are for further filtering results.
     *
     * Returns:
     * A list of `GradeElement` satisfing given filters.
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static queryGradesQueryGet({
        id1,
        id2,
        title = '',
        classId = '',
        semester,
        xToken = '',
        cookieToken = '',
    }: {
        id1?: string,
        id2?: string,
        /**
         * '課程名稱'
         */
        title?: string,
        /**
         * '班次'
         */
        classId?: string,
        /**
         * Semester between 90-1 ~ 130-2
         */
        semester?: string,
        /**
         * Token represented student_id via X-Token header, automatically sent by background.js. Same as `cookie_token`.
         */
        xToken?: string,
        /**
         * Token represented student_id via cookie. Same as `x_token`. This parameter is for testing purpose. You should generally rely on `x_token`.
         */
        cookieToken?: string,
    }): CancelablePromise<Array<GradeElement>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/query',
            cookies: {
                'cookie_token': cookieToken,
            },
            headers: {
                'x-token': xToken,
            },
            query: {
                'id1': id1,
                'id2': id2,
                'title': title,
                'class_id': classId,
                'semester': semester,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Query Grades Batch
     * @auth_required
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static queryGradesBatchQueryBatchPost({
        requestBody,
        xToken = '',
        cookieToken = '',
    }: {
        requestBody: Array<Record<string, any>>,
        /**
         * Token represented student_id via X-Token header, automatically sent by background.js. Same as `cookie_token`.
         */
        xToken?: string,
        /**
         * Token represented student_id via cookie. Same as `x_token`. This parameter is for testing purpose. You should generally rely on `x_token`.
         */
        cookieToken?: string,
    }): CancelablePromise<Array<Array<GradeElement>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/query/batch',
            cookies: {
                'cookie_token': cookieToken,
            },
            headers: {
                'x-token': xToken,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get Suggestion
     * @returns CourseSuggestion Successful Response
     * @throws ApiError
     */
    public static getSuggestionQuerySuggestionGet({
        keyword,
    }: {
        keyword: string,
    }): CancelablePromise<Array<CourseSuggestion>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/query/suggestion',
            query: {
                'keyword': keyword,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Report Issue
     * @returns any Successful Response
     * @throws ApiError
     */
    public static reportIssueReportIssuePost({
        requestBody,
    }: {
        requestBody: IssueData,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/report/issue',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Submit Page
     * @returns PageResponse Successful Response
     * @throws ApiError
     */
    public static submitPageSubmitPagePost({
        cookie,
        requestBody,
    }: {
        cookie: string,
        requestBody: Page,
    }): CancelablePromise<PageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/submit/page',
            query: {
                'cookie': cookie,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Submit Grade
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static submitGradeSubmitGradePost({
        requestBody,
    }: {
        requestBody: GradeWithUpdate,
    }): CancelablePromise<GradeElement> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/submit/grade',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Submit Grades
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static submitGradesSubmitGradesPost({
        requestBody,
    }: {
        requestBody: Array<GradeWithUpdate>,
    }): CancelablePromise<Array<GradeElement>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/submit/grades',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get User
     * @returns User Successful Response
     * @throws ApiError
     */
    public static getUserUserGet({
        token,
    }: {
        token: string,
    }): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user',
            query: {
                'token': token,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get Course
     * @returns CourseReadWithGrade Successful Response
     * @throws ApiError
     */
    public static getCourseCourseId1Get({
        id1,
    }: {
        id1: string,
    }): CancelablePromise<CourseReadWithGrade> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/course/{id1}',
            path: {
                'id1': id1,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get Semester
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getSemesterSemesterGet(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/semester',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get Ttl
     * Time-to-live in seconds.
     * @returns number Successful Response
     * @throws ApiError
     */
    public static getTtlTimeToLiveGet(): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/time-to-live',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get Root
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getRootGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
}

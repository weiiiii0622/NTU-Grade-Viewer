/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GradeElement } from '../models/GradeElement';
import type { Page } from '../models/Page';
import type { PageResponse } from '../models/PageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
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
        requestBody,
    }: {
        requestBody: Page,
    }): CancelablePromise<PageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/submit/page',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Submit Grade
     * @returns any Successful Response
     * @throws ApiError
     */
    public static submitGradeSubmitGradePost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/submit/grade',
            errors: {
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Submit Grades
     * @returns any Successful Response
     * @throws ApiError
     */
    public static submitGradesSubmitGradesPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/submit/grades',
            errors: {
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
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
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get All Grades
     * @test_only
     *
     * Just get all grades.
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static getAllGradesGradeAllGet({
        xToken = '',
        cookieToken = '',
    }: {
        /**
         *
         * Token represented student_id via cookie.
         * Same as `x_token`. This parameter is for testing purpose.
         * You should generally rely on `x_token`.
         *
         */
        xToken?: string,
        /**
         *
         * Token represented student_id via cookie.
         * Same as `x_token`.
         * This parameter is for testing purpose.
         * You should generally rely on `x_token`.
         *
         */
        cookieToken?: string,
    }): CancelablePromise<Array<GradeElement>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/grade/all',
            cookies: {
                'cookie_token': cookieToken,
            },
            headers: {
                'x-token': xToken,
            },
            errors: {
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Db Test
     * @returns any Successful Response
     * @throws ApiError
     */
    public static dbTestDbGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/db',
            errors: {
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     *  Add Auth
     * @test_only
     *
     * Add a user to database. This will set `token` in cookies.
     *
     * Returns:
     * Token generated by given student id.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addAuthAddAuthStudentIdGet({
        studentId,
    }: {
        /**
         * A student's id, e.g. b10401006.
         */
        studentId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/add-auth/{student_id}',
            path: {
                'student_id': studentId,
            },
            errors: {
                401: `Unauthorized`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
}

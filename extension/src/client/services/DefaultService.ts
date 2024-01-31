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
    public static getRootGet({
        a,
    }: {
        a: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
            query: {
                'a': a,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Submit Page
     * @returns PageResponse Successful Response
     * @throws ApiError
     */
    public static submitPagePagePost({
        requestBody,
    }: {
        requestBody: Page,
    }): CancelablePromise<PageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/page',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get All Grades
     * @auth_required
     * @test_only
     *
     * Just get all grades.
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static getAllGradesGradesAllGet({
        xToken = '',
        cookieToken = '',
    }: {
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
            url: '/grades/all',
            cookies: {
                'cookie_token': cookieToken,
            },
            headers: {
                'x-token': xToken,
            },
            errors: {
                422: `Validation Error`,
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
    public static queryGradesQueryGradesGet({
        id1 = '',
        id2 = '',
        title = '',
        classId = '',
        semester = '',
        xToken = '',
        cookieToken = '',
    }: {
        /**
         * '課號', e.g. CSIE1212
         */
        id1?: string,
        /**
         * '課程識別碼', e.g. '902 10750'. Note the space character.
         */
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
            url: '/query/grades',
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
                422: `Validation Error`,
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
        });
    }
    /**
     * F
     * @auth_required
     * @returns any Successful Response
     * @throws ApiError
     */
    public static fTestGet({
        a,
        xToken = '',
        cookieToken = '',
    }: {
        a: number,
        /**
         * Token represented student_id via X-Token header, automatically sent by background.js. Same as `cookie_token`.
         */
        xToken?: string,
        /**
         * Token represented student_id via cookie. Same as `x_token`. This parameter is for testing purpose. You should generally rely on `x_token`.
         */
        cookieToken?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/test',
            cookies: {
                'cookie_token': cookieToken,
            },
            headers: {
                'x-token': xToken,
            },
            query: {
                'a': a,
            },
            errors: {
                422: `Validation Error`,
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
            url: '/add-auth/{studentId}',
            path: {
                'studentId': studentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}

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
     * Getuserauth
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getUserAuthAuthStudentIdGet({
        studentId,
    }: {
        studentId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/{studentId}',
            path: {
                'studentId': studentId,
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
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static getAllGradesGradesAllGet({
        xToken = '',
        cookieToken = '',
    }: {
        xToken?: string,
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
        id1?: string,
        id2?: string,
        title?: string,
        classId?: string,
        semester?: string,
        xToken?: string,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static fTestGet({
        a,
        xToken = '',
        cookieToken = '',
    }: {
        a: number,
        xToken?: string,
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addAuthAddAuthStudentIdGet({
        studentId,
    }: {
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

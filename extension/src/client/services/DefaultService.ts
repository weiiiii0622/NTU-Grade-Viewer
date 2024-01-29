/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GradeElement } from '../models/GradeElement';
import type { Page } from '../models/Page';
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static submitPagePagePost({
        requestBody,
    }: {
        requestBody: Page,
    }): CancelablePromise<any> {
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
    public static getAllGradesGradesAllGet(): CancelablePromise<Array<GradeElement>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/grades/all',
        });
    }
    /**
     * Query Grades
     * @returns GradeElement Successful Response
     * @throws ApiError
     */
    public static queryGradesQueryGradesGet(): CancelablePromise<Array<GradeElement>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/query/grades',
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
}

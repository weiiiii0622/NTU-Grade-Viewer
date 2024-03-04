/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateBase = {
    /**
     * An integer between [0, 9], representing a grade. Example: 0 -> F, 9 -> A+.
     */
    pos: number;
    lower: (number | string);
    higher: (number | string);
    solid?: boolean;
};


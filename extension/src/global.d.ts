import { TabAction, TabListenerState } from "./api";

declare global {
   var APP_URL: string; // will be set by webpack DefinePlugin
   var APP_TITLE: string;
   var NTU_GRADE_VIEWER__APP_INDICATOR: HTMLElement & {
      setAttribute(name: TabAction, value: TabListenerState): void;
   };
   // var DIALOG_READY: string;
   // var DIALOG_DISABLE_POINTER: string;
}

export {};

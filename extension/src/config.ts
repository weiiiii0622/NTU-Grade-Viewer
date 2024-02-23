const DIALOG_WIDTH = 452;
// const DIALOG_HEIGHT = 525;
const DIALOG_HEIGHT = 489;
const DIALOG_GAP = 8;

export { DIALOG_GAP, DIALOG_HEIGHT, DIALOG_WIDTH };

// from iframe to content
export enum DialogAction {
   Ready,
   Position,
   DisablePointer,
   Active,
}

import React, { ReactElement, ReactNode, cloneElement, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useElementEventHandler, useWindowSize } from "../hooks/utils";
import { clamp, cn } from "../utils";
import clsx from "clsx";


const CONFIG = {
   gapX: 12,
   gapY: 12,
   arrowSize: 20,

   popperGap: 12,
   popperMargin: 24,

   animationDuration: 3000,
}

type Rect = {
   left: number,
   right: number,
   top: number,
   bottom: number,
}

type TourContextValue = {
   open: boolean,
   setOpen(open: boolean): void,
   // trigger: HTMLElement,
   target: HTMLElement | null,
   setTarget(target: HTMLElement | null): void,
   targetRect: Rect;

   targetPosition?: [number, number];
   backdropColor?: string;

   runningAnimationCount: number;
   setRunningAnimationCount: (count: number | ((_count: number) => number)) => void,
}
const TourContext = createContext<TourContextValue>(null!);

function TourContextProvider(props: TourContextValue & { children: ReactNode | ReactNode[] }) {
   const { children, ...value } = props
   return <TourContext.Provider value={value}>
      {children}
   </TourContext.Provider>
}
function useTourContext(): TourContextValue {
   return useContext(TourContext);
}

function useRect(target: HTMLElement | null): Rect {

   if (target) {
      const { gapX, gapY } = CONFIG;
      let { left, right, top, bottom } = target.getBoundingClientRect();
      if (target) {
         left -= gapX;
         right += gapX;
         top -= gapY;
         bottom += gapY;
      }
      return { left, right, top, bottom };
   } else {
      return { left: 0, right: 0, top: 0, bottom: 0 };
   }
}


// ? The dom is copied from antd
type TourProps = {
   // todo let this be optional
   open: boolean;
   onOpenChange(open: boolean): void;
   mask?: boolean,
}
export function Tour(props: React.PropsWithChildren<TourProps>) {
   const { open, onOpenChange, children } = props;
   const [target, setTarget] = useState<HTMLElement | null>(null);

   const [runningAnimationCount, setRunningAnimationCount] = useState(0);

   const originalOverflow = useRef<string | null>(null);
   useEffect(() => {
      if (!originalOverflow.current)
         originalOverflow.current = window.getComputedStyle(document.body).overflow;
      if (open)
         document.body.style.overflow = 'hidden'
      else
         document.body.style.overflow = originalOverflow.current
   }, [open])

   const targetRect = useRect(target);

   return <TourContextProvider {...{
      open,
      setOpen: onOpenChange,
      target,
      setTarget,
      targetRect,
      runningAnimationCount,
      setRunningAnimationCount,
   }} >
      {children}
      <TourMask />
   </TourContextProvider>
}

export function TourTrigger() {

}

export function TourTarget(props: { asChild?: boolean, children: ReactElement }) {
   const { setTarget } = useTourContext();
   const ref = useRef<HTMLButtonElement>(null);
   useEffect(() => {
      if (ref.current)
         setTarget(ref.current);
   }, [])

   const { asChild = false, children } = props;
   if (asChild) {
      return <children.type {...children.props} ref={ref} />
   }
   return <button ref={ref}>
      {children}
   </button>
}

function getRect(target: HTMLElement | null) {


}

function TourMask() {

   const { target, backdropColor } = useTourContext();
   const [windowWidth, windowHeight] = useWindowSize();

   let { runningAnimationCount, setRunningAnimationCount,
      open, targetRect: { left, right, top, bottom } } = useTourContext();

   const width = right - left;
   const height = bottom - top;

   const [openBuf, setOpenBuf] = useState(open);
   if (openBuf !== open)
      setOpenBuf(open)
   if (!open && openBuf)
      setRunningAnimationCount(cnt => cnt + 1)

   return <>
      {(openBuf || runningAnimationCount) ? createPortal(
         // {open ? createPortal(
         <div
            className={
               cn(" [animation-fill-mode:forwards] fixed inset-0  z-[10000] pointer-events-none overflow-hidden ",
                  open ? "animate-in fade-in-15" : "animate-out fade-out-0",
                  `[animation-duration:200ms]`
               )
            }

            // onAnimationStart={() => { console.log('anim start'); setRunningAnimationCount(cnt => cnt + 1) }}
            onAnimationEnd={() => { console.log('anim end'); setRunningAnimationCount(cnt => cnt - 1) }}
         >
            <svg className="w-full h-full ">
               <defs>
                  <mask id="tour-mask">
                     <rect x="0" y="0" width="100vw" height="100vh" fill="white" />
                     <rect
                        // className="  [transform-duration:0s] transition-none animate-in [animation-duration:300ms] zoom-in-95"
                        x={left} y={top}
                        rx="5"
                        width={width} height={height} fill="black"
                     />
                  </mask>
               </defs>
               <rect x="0" y="0" width="100%" height="100%" fill={backdropColor || "rgba(0,0,0,0.5)"}
                  mask="url(#tour-mask)"
               ></rect>

               <TransparentRect {...{ x: 0, y: 0, width: left, height: '100%' }} />
               <TransparentRect {...{ x: 0, y: 0, width: '100%', height: top }} />
               <TransparentRect {...{ x: right, y: 0, width: windowWidth - right, height: '100%' }} />
               <TransparentRect {...{ x: 0, y: bottom, width: '100%', height: windowHeight - bottom }} />
            </svg>
         </div >
         , document.body
      )
         : null
      }
   </>
}


// cover other elements to prevent pointer-events 
function TransparentRect(props: { x: number | string, y: number | string, width: number | string, height: number | string }) {
   const { x, y, width, height } = props;


   return <rect fill="transparent" pointerEvents="auto"
      x={x} y={y}
      width={width}
      height={height}
   />
}

type Vec2 = [number, number]

type PopperContextValue = {
   // position: Vec2
   // setPosition(pos: Vec2): void,
   hasArrow: boolean,
   arrowType: ArrowType,
   arrowPosition: Vec2,
}
const PopperContext = createContext<PopperContextValue>(null!);

function Arrow() {

}

enum ArrowType {
   Up,
   Down,
   None
}


function usePopperInfo(props:
   { width: number, height: number, }
): {
   arrowType: ArrowType,
   arrowOffsetX: number,
   position: Vec2
} {
   const { width, height } = props;
   const { target, targetPosition, targetRect } = useTourContext();
   const { popperGap, popperMargin } = CONFIG;
   const { left, right, top, bottom } = targetRect;
   const [windowWidth, windowHeight] = useWindowSize();

   let arrowType: ArrowType;
   let arrowOffsetX: number;
   let position: Vec2;

   const clampX = (x: number) => clamp(x, popperMargin, windowWidth - popperMargin);
   const clampY = (y: number) => clamp(y, popperMargin, windowHeight - popperMargin);

   if (target) {

      console.log(top, height)
      let x: number, y: number;
      if (top > window.innerHeight - bottom)
         // top side is further from boundary 
         // y = Math.max(popperMargin, top - height - popperGap),
         // y = clampY(),
         y = top - height - popperGap,
            arrowType = ArrowType.Down;
      else
         // y = Math.min(windowHeight - popperMargin, bottom + popperGap),
         // y = clampY(),
         y = bottom + popperGap,
            arrowType = ArrowType.Up;
      // console.log(arrowType)
      // x = clamp((left + right) / 2 - width / 2, 0, windowWidth);
      // x = clampX();
      x = (left + right) / 2 - width / 2;

      position = [x, y];
      arrowOffsetX = width / 2;

   } else if (targetPosition) {

      const [x0, y0] = targetPosition;
      let x: number, y: number;
      if (y0 > windowHeight / 2)
         y = y0 - height - popperGap,
            arrowType = ArrowType.Down;
      else
         y = y0 + popperGap,
            arrowType = ArrowType.Up;
      // x = clamp(x0 - width / 2, 0, windowWidth)
      x = x0 - width / 2

      position = [x, y];
      arrowOffsetX = x0 - x;

   } else {
      position = [
         windowWidth / 2 - width / 2,
         windowHeight / 2 - height / 2,
      ]
      arrowType = ArrowType.None;
      arrowOffsetX = 0;
   }

   const [x, y] = position;
   position = [clampX(x), clampY(y)];


   return {
      arrowType,
      arrowOffsetX,
      position,
   };
}

function TourPopper(props: { children: ReactNode }) {
   const { children } = props;

   return <div >
      {children}
   </div>
}

export function TourContent(props: { children: ReactNode | ReactNode[] }) {
   const { children } = props;

   const [width, setWidth] = useState(0);
   const [height, setHeight] = useState(0);

   const ref = useRef<HTMLDivElement>(null);
   // useEffect(() => {
   //    if (ref.current) {
   //       setWidth(ref.current.getBoundingClientRect().width);
   //       setHeight(ref.current.getBoundingClientRect().height);
   //    }
   // });

   const {
      arrowOffsetX, arrowType, position: [x, y]
   } = usePopperInfo({
      width, height
      // width: 500, height: 300
   });
   const { open, setOpen, } = useTourContext();

   // const [openBuf, setOpenBuf] = useState(open);
   // if (openBuf !== open)
   //    setOpenBuf(open)
   function getAnimationName() {
      return ref.current
         ? getComputedStyle(ref.current).animationName || 'none'
         : 'none';
   }

   const prevOpenRef = useRef(open);
   const prevAnimationNameRef = useRef('none');
   const [animationRunning, setAnimationRunning] = useState(false);

   console.log("wh=", width, height)

   useEffect(() => {
      if (!open && prevOpenRef.current !== open && ref.current) {
         const animationName = getAnimationName();
         if (prevAnimationNameRef.current !== animationName)
            setAnimationRunning(true);
      }
      prevOpenRef.current = open;
   }, [open])

   useEffect(() => {
      if (ref.current && !width && !height) {
         const { width, height } = ref.current.getBoundingClientRect();
         setWidth(width);
         setHeight(height);
      }
   })

   return <>
      {(open || animationRunning) ? createPortal(<div
         // {open ? createPortal(<div
         ref={ref}
         className={cn(
            " fixed z-[10001] ",
            ` [animation-duration:300ms] [animation-fill-mode:forwards] slide-in-from-left-0	`,
            open
               ? [
                  // todo: add zoom 
                  " fade-in-0  zoom-in-90",
                  arrowType == ArrowType.Up
                     ? "slide-in-from-top-2"
                     : "slide-in-from-bottom-2"
                  , ' animate-in '
               ]
               : [
                  "  fade-out-0  zoom-out-90",
                  arrowType == ArrowType.Up
                     ? "slide-in-from-bottom-2"
                     : "slide-in-from-top-2"
                  , ' animate-out'
               ],
            // !(width && height) ? (console.log('animation-none'), "invisible animate-none") : ''
         )}
         style={{
            left: x,
            top: y,
            animation: !(width && height) ? 'none' : undefined,
            visibility: !(width && height) ? 'hidden' : undefined,
            // transform: `translate(${x}px, ${y}px)`
         }}
         // onAnimationStart={() => (console.log('start'), setRunningAnimationCount(cnt => cnt + 1))}
         onAnimationEnd={(e) => {
            if (e.animationName === getAnimationName() && e.animationName === prevAnimationNameRef.current)
               setAnimationRunning(false);
         }}
         onResize={function (this: HTMLDivElement, e) {
            // console.log('resize', this.getBoundingClientRect())
            // setWidth(this.getBoundingClientRect().width);
            // setHeight(this.getBoundingClientRect().height);
         }}
      >
         {children}
      </div >, document.body
      )
         : null
      }
   </>
}


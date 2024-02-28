/**
 * Found out chrome.sidePanel is actually more suitable for this LOL 🤡
 */
import { ErrorBoundary, ErrorBoundaryContext } from "react-error-boundary";
import { } from './foo'

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { History, getStorage, sendRuntimeMessage, setStorage } from "../api";
import styled, { keyframes } from 'styled-components';
import { CourseBase, CourseSuggestion } from "../client";
import { useStorage } from "../hooks/useStorage";
import { IconSearch, IconX } from '@tabler/icons-react';
import { ScrollArea, ScrollBar } from "./lib/scroll-area";

import "../style.css";
import { createRoot } from "react-dom/client";
import { DialogMessage, addDialogMessageHandler, getSortedCourses, isRecent } from "./utils";
import { animated, config, useSpring } from "@react-spring/web";

const REFERRER = document.referrer || '*';
//console.log("Referrer: ", REFERRER)

/* --------------------------------- Config --------------------------------- */

// const WIDTH = 452;
// const HEIGHT = 525;
// const GAP = 8;
import { DIALOG_WIDTH as WIDTH, DIALOG_HEIGHT as HEIGHT, DialogAction } from "../config"
import { ItemList, ItemProps } from "./itemList";
import { ChartPage } from "./chartPage";
import { RecentItemsSection } from './recentItemsSection';
import { cn } from '../components/shadcn-ui/lib';
import { Error, AuthError } from "./error";
import { Loading } from "./loading";
import { hexToRgb, rgbToHsl } from "../utils";

/* -------------------------------- Position -------------------------------- */

enum Direction {
   Up,
   Down,
};



function transformDialogPosition(pos: [number, number]): [Direction, [number, number]] {
   const [x, y] = pos;
   const dir = y > window.innerHeight / 2 ? Direction.Up : Direction.Down;
   return [dir, [x, y]];
}

/* ---------------------------------- Hooks --------------------------------- */

const KEYWORD_TIMEOUT = 500  // ms  
const MAX_DELAY = 2000;  // ms 

export type ItemOnClickProps = {
   course: CourseBase;
   classCount: number;
}

function useItems(
   { histories, rawKeyword, onClickFactory }: { histories: History[], rawKeyword: string, onClickFactory: (props: ItemOnClickProps) => () => void }
): [boolean, ItemProps[]] {

   const [loading, setLoading] = useState(true);
   const [courses, setItems] = useState<CourseSuggestion[]>([]);


   const [keyword, setKeyword] = useState('');
   useEffect(() => {
      if (!keyword) {
         //console.log('keyword empty; ', rawKeyword);
         setItems([]);
         setLoading(!!rawKeyword);
         return;
      }

      let cancel = false;
      setLoading(true);
      sendRuntimeMessage('service', { funcName: 'getSuggestionQuerySuggestionGet', args: { keyword: keyword } }).then(
         ([_grades, error]) => {
            if (cancel)
               return;
            if (error)
               throw 'gg'  // todo
            setItems(_grades);
            setLoading(false);
         }
      )
      return () => { cancel = true; setLoading(false); }
   }, [keyword]);

   const curTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
   const changeStart = useRef<number | null>(null);
   useEffect(() => {
      if (!keyword)
         setLoading(!!rawKeyword);
      if (!curTimeout.current && rawKeyword !== keyword)
         setLoading(true);

      if (curTimeout.current)
         clearTimeout(curTimeout.current);

      curTimeout.current = setTimeout(() => {
         setKeyword(rawKeyword);
         curTimeout.current = null;
         changeStart.current = null;
      }, KEYWORD_TIMEOUT);

      if (!changeStart.current)
         changeStart.current = Date.now();
      if (Date.now() - changeStart.current >= MAX_DELAY) {
         setKeyword(rawKeyword);
         changeStart.current = null;
      }

   }, [rawKeyword]);

   //console.log(keyword);

   return [loading, getSortedCourses(courses, histories).map(course => ({
      type: isRecent(course, histories) ? 'recent' : 'normal',
      course, count: course.count, onClick: onClickFactory({ course, classCount: course.count }),
   }))]

   // todo: delay
}




/* -------------------------------- Component ------------------------------- */

// todo: responsive position

const DialogWrapper = animated(styled.div`
    box-sizing: border-box;
    position: absolute;

    background: rgba(255,255,255,0.85);
    border:  #c7c7c7 solid 1px;
    border-radius: 15px;
    box-shadow: 0px 4px 52.8px 4px rgba(0,0,0,0.15);
    backdrop-filter: blur(40px);
    
    display: flex;
    align-items: stretch;
` )

type DialogProps = {
   // position: [number, number];
   // parent?: HTMLElement
}

export function Dialog({ }: DialogProps) {

   const containerRef = useRef<HTMLDivElement>(null);

   /* ------------------------------ Display Logic ----------------------------- */

   const [active, setActive] = useState(false);
   const [rawKeyword, setRawKeyword] = useState('');
   const [position, setPosition] = useState<[number, number]>([0, 0]);
   // const parentRect = parent.getBoundingClientRect()


   useEffect(() => {
      const handler = (msg: DialogMessage) => {
         if (typeof msg === 'string') {
            if (msg === 'close')
               setActive(false);
            return;
         }
         const { position, selection } = msg;
         //console.log('dialog')
         //console.log(position)
         setActive(true);
         setPosition(position)
         setRawKeyword(selection);
      }

      const cleanup = addDialogMessageHandler(handler);
      return cleanup;
   }, []);


   const inactiveEvents: (keyof WindowEventMap)[] = [
      'click'
   ];

   // useEffect(() => {
   //    // ! not sure if this is correct :(
   //    if (!containerRef.current)
   //       return;
   //    const funcs: Record<string, [(...args: any) => void, (...args: any) => void]> = {};
   //    for (const name of inactiveEvents) {
   //       const f = () => { setActive(false); console.log(name) };
   //       const _f = (e: Event) => { console.log('card clicked!'); console.log(e); e.stopPropagation() };
   //       window.addEventListener(name, f);
   //       containerRef.current.addEventListener(name, _f, false);

   //       funcs[name] = [f, _f];
   //    }
   //    return () => {
   //       if (!containerRef.current)
   //          return;

   //       for (const name of inactiveEvents) {
   //          const [f, _f] = funcs[name];
   //          window.removeEventListener(name, f);
   //          containerRef.current?.removeEventListener(name, _f, false);
   //       }
   //    }
   // })

   // todo: fade out

   const [dir, realPos] = transformDialogPosition(position);
   const [spring, api] = useSpring(() => {
      const sign = dir === Direction.Up ? -1 : 1;
      const origin = `center ${dir === Direction.Up ? 'bottom' : 'top'}`;
      const transform = `scale(${active ? '1' : '0'})`;
      const opacity = active ? 1 : 0;

      return {
         opacity,
         transformOrigin: origin,
         transform,
         config: config.stiff,
      }

   }, [active, dir]);

   useEffect(() => {
      window.parent.postMessage({ action: DialogAction.Active, active }, REFERRER);
   }, [active]);

   // console.log('position: ', realPos);
   useEffect(() => {
      window.parent.postMessage({ action: DialogAction.Position, position: realPos }, REFERRER);
   }, [realPos]);

   useEffect(() => {
      // console.log('effect: ', active, realPos);

      const [x0, y0] = realPos;

      function isInFrame(x: number, y: number) {
         const l = x0, r = l + WIDTH, t = y0, b = t + HEIGHT;
         const inFrame = l <= x && x <= r && t <= y && y <= b;

         // console.log(inFrame, "(frame)");
         // console.log(l, r, t, b)
         // console.log(x, y);
         return inFrame;
      }

      const f = (e: MouseEvent) => {
         const x = e.clientX, y = e.clientY;
         if (!active || !isInFrame(x, y)) {

            window.parent.postMessage({ action: DialogAction.DisablePointer }, REFERRER);
         }
      }
      document.body.addEventListener('mousemove', f);

      return () => { document.body.removeEventListener('mousemove', f); }
   }, [active, realPos]);

   // ? maybe just use fixed
   const parentRect = useMemo(() => {
      if (containerRef.current)
         return containerRef.current.parentElement!.getBoundingClientRect()
      return { x: 0, y: 0 };
   }, [])
   const left = realPos[0] - parentRect.x;
   const top = realPos[1] - parentRect.y;
   // const left = 0;
   // const top = 0;


   /* ------------------------------- Result Page ------------------------------ */

   const [courseId1, setCourseId1] = useState<CourseBase['id1'] | null>(null);
   const [title, setTitle] = useState<string | null>(null);

   function itemOnClickFactory(props: ItemOnClickProps) {
      return () => {
         const { classCount, course } = props;
         const { id1: courseId1, title } = course;

         setPageIdx(1);
         setCourseId1(courseId1);
         setTitle(title);

         // ! side effect
         getStorage('histories').then(histories => {
            //console.log('prev histories: ', histories);

            const timeStamp = Date.now();
            const newHistory: History = { course, classCount, timeStamp };
            if (!histories)
               histories = [newHistory];
            if (histories.findIndex(h => h.course.id1 === courseId1) === -1)
               histories = [...histories, newHistory];
            else {
               const idx = histories.findIndex(h => h.course.id1 === courseId1);
               histories[idx].timeStamp = timeStamp;
            }
            setStorage({ 'histories': histories })
         })
      }
   }
   let [loadingHistories, histories] = useStorage('histories');
   histories = histories ?? [];
   const [loadingItems, items] = useItems({ histories, rawKeyword, onClickFactory: itemOnClickFactory });

   function goBack() {
      setPageIdx(0);
      // ? maybe not necessary
      // setCourseId1(null);
   }

   /* ---------------------------------- Auth ---------------------------------- */

   const [isAuth, setIsAuth] = useState<boolean>(false);

   /* ----------------------------- Page Animation ----------------------------- */

   const [pageIdx, setPageIdx] = useState(0);

   /* --------------------------------- Render --------------------------------- */

   // useEffect(() => {
   //    if (window.top === window.self)
   //       setActive(true);
   //    setPosition([window.innerWidth / 2 - WIDTH, window.innerHeight / 2 - HEIGHT]);
   // }, []);


   if (!isAuth)
      getStorage('token').then((data) => {
         if (data !== undefined) {
            setIsAuth(true);
         }
      });

   const contentLoading = (loadingItems && !items.length) ||
      loadingHistories && !histories.length;


   const bgColor = new URLSearchParams(window.location.search).get('bgColor');
   let dialogColor: string | undefined;
   // console.log('bgColor: ', bgColor)
   if (bgColor) {
      const [h, s, l] = rgbToHsl(hexToRgb(bgColor));
      // console.log('hsl', h, s, l)
      if (l < 255 * 2 / 3)
         dialogColor = 'white';
   }


   if (!isAuth)
      return (
         <DialogWrapper ref={containerRef} style={{
            left,
            top,

            width: WIDTH,
            height: HEIGHT,

            overflowX: 'hidden',
            ...spring,
            backgroundColor: dialogColor,
         }}>
            <AuthError />
         </DialogWrapper>
      )


   return (
      <DialogWrapper
         ref={containerRef}
         style={{
            left,
            top,

            width: WIDTH,
            height: HEIGHT,

            overflowX: 'hidden',
            ...spring,
            backgroundColor: dialogColor,
         }}
      >
         <ErrorBoundary fallback={<Error />}>
            <InnerContainer pageIdx={pageIdx}>
               <PageContainer>
                  <div className="flex flex-row items-center justify-between mb-4 ml-2" >
                     <h3 className="  text-xl font-bold  text-[#4e4e4e] ">
                        {APP_TITLE}
                     </h3>
                     <CloseBtn onClick={() => setActive(false)} />
                  </div>
                  <SearchInput
                     className="mx-2 mb-6"
                     keyword={rawKeyword} setKeyword={setRawKeyword}
                  />
                  {contentLoading
                     ? <Loading />
                     : <ScrollArea className='pr-4 '>
                        {rawKeyword
                           ? <ItemList title="搜尋結果" items={items} />
                           : <RecentItemsSection
                              histories={histories}
                              // items={items.filter(item => item.type === 'recent')}
                              itemOnClickFactory={itemOnClickFactory}
                           />
                        }

                        <ScrollBar orientation="vertical"
                           className='w-2 '
                        // todo: add more padding
                        />
                     </ScrollArea>
                  }

               </PageContainer>
               <PageContainer>
                  {courseId1 && title
                     ? <ChartPage
                        key={courseId1}
                        {...{
                           title,
                           courseId1,
                           defaultChartType: 'pie',
                           // defaultClassId: null,
                           defaultClassKey: null,
                           close: () => setActive(false),
                           goBack,
                        }} />
                     : null
                  }
               </PageContainer>
            </InnerContainer>
         </ErrorBoundary>
      </DialogWrapper>
   );

}


/**
 * Handling horizontal spacing & overflow of pages.
 */
function InnerContainer({ children, pageIdx }: { children: ReactNode[], pageIdx: number }) {
   return <div className="box-border flex flex-row w-full h-full p-4">
      <div className="w-full overflow-hidden ">
         <div className="box-border flex flex-row items-stretch w-full h-full"
            style={{
               transform: `translateX(${-pageIdx * 100}%)`,
               transition: 'all 0.2s linear',
            }}
         >
            {children}
         </div>
      </div>
   </div>
}

function PageContainer({ children }: { children: ReactNode[] | ReactNode }) {

   return <div className="flex flex-col min-w-full" >
      {children}
   </div>

}


type SearchInputProps = {
   keyword: string;
   setKeyword: React.Dispatch<React.SetStateAction<string>>,
} & React.HTMLAttributes<HTMLInputElement>;
function SearchInput(props: SearchInputProps) {

   const { keyword, setKeyword, className, ...restProps } = props;

   // todo: outline when focused

   return <div
      className={className + " min-h-8 has-[input:focus]:ring-1 has-[input:focus]:ring-[#8e8e8e] px-2 gap-1 border-[#d9d9d9] border-solid border rounded-md flex flex-row items-center"}
   >
      <IconSearch size={16} stroke={1} color={'#828282'} />
      <input
         // {...restProps}
         className="  bg-transparent focus:outline-none  w-full  py-1 text-[#828282] placeholder:text-[#d9d9d9] text-xs  border-none"
         onChange={e => setKeyword(e.target.value)}
         value={keyword}
         placeholder="輸入課程名稱"
      >

      </input>
   </div>
}

export function CloseBtn({ onClick, className, ...props }: { onClick: () => void } & React.ComponentProps<'span'>) {
   return <span
      className={cn(
         " hover:cursor-pointer aspect-square h-6 flex justify-center items-center hover:bg-[#d9d9d9] rounded-full",
         className
      )}
      onClick={onClick}
   >
      <IconX size={20} stroke={2} color={'#8e8e8e'} />
   </span>
}


const rootEle = document.querySelector("#root")!;
const dialogRoot = createRoot(rootEle);
document.body.insertBefore(rootEle, null);

dialogRoot.render(<Dialog />);
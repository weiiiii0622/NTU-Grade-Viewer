/**
 * Found out chrome.sidePanel is actually more suitable for this LOL 🤡
 */
import { } from './foo'

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { History, getStorage, sendRuntimeMessage, setStorage } from "../api";
import styled from 'styled-components';
import { CourseBase, CourseSuggestion } from "../client";
import { useStorage } from "../hooks/useStorage";
import { IconSearch, IconX } from '@tabler/icons-react';
import { ScrollArea, ScrollBar } from "../../@/components/ui/scroll-area";

import "../style.css";
import { createRoot } from "react-dom/client";
import { DialogMessage, addDialogMessageHandler, getSortedCourses, isRecent } from "./utils";
import { animated, config, useSpring } from "@react-spring/web";

const REFERRER = document.referrer || '*';
console.log("Referrer: ", REFERRER)

/* --------------------------------- Config --------------------------------- */

// const WIDTH = 452;
// const HEIGHT = 525;
// const GAP = 8;
import { DIALOG_WIDTH as WIDTH, DIALOG_HEIGHT as HEIGHT, DialogAction } from "../config"
import { ItemList, ItemProps } from "./itemList";
import { ChartPage } from "./chartPage";
import { RecentItemsSection } from './recentItemsSection';
import { cn } from '../components/shadcn-ui/lib';

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

function useItems(
   { histories, rawKeyword, onClickFactory }: { histories: History[], rawKeyword: string, onClickFactory: (courseId1: CourseBase['id1']) => () => void }
): [boolean, ItemProps[]] {

   const [loading, setLoading] = useState(true);
   const [courses, setItems] = useState<CourseSuggestion[]>([]);
   useEffect(() => {
      if (!rawKeyword) {
         setItems([]);
         setLoading(false);
         return;
      }

      let cancel = false;
      setLoading(true);
      sendRuntimeMessage('service', { funcName: 'getSuggestionQuerySuggestionGet', args: { keyword: rawKeyword } }).then(
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
   }, [rawKeyword]);


   // console.log('course: ')
   // console.log(courses, courses.sort(cmp));
   // console.log(courses.map(c => findHistory(c)));


   return [loading, getSortedCourses(courses, histories).map(course => ({
      type: isRecent(course, histories) ? 'recent' : 'normal',
      course, count: course.count, onClick: onClickFactory(course.id1),
   }))]
   // console.log(items);
   // return items;

   // todo: delay
}




/* -------------------------------- Component ------------------------------- */

const DialogWrapper = animated(styled.div`
    box-sizing: border-box;
    position: absolute;

    background: rgba(255,255,255,0.99);
    border:  #adadad solid 1px;
    border-radius: 15px;
    box-shadow: 0px 4px 52.8px 4px rgba(0,0,0,0.09);
    backdrop-filter: blur(4px);
    
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
      const handler = ({ position, selection }: DialogMessage) => {
         console.log('dialog')
         console.log(position)
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

   function itemOnClickFactory(courseId1: CourseBase['id1']) {
      return () => {
         setPageIdx(1);
         setCourseId1(courseId1);

         // ! side effect
         getStorage('histories').then(histories => {
            console.log('prev histories: ', histories);

            const timeStamp = Date.now();
            if (!histories)
               histories = [{ courseId1, timeStamp }];
            if (histories.findIndex(h => h.courseId1 === courseId1) === -1)
               histories = [...histories, { courseId1, timeStamp }];
            else {
               const idx = histories.findIndex(h => h.courseId1 === courseId1);
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


   /* ----------------------------- Page Animation ----------------------------- */

   const [pageIdx, setPageIdx] = useState(0);

   /* --------------------------------- Render --------------------------------- */

   // useEffect(() => {
   //    if (window.top === window.self)
   //       setActive(true);
   //    setPosition([window.innerWidth / 2 - WIDTH, window.innerHeight / 2 - HEIGHT]);
   // }, []);


   return (
      <DialogWrapper
         ref={containerRef}
         style={{
            left,
            top,

            width: WIDTH,
            height: HEIGHT,

            overflowX: 'hidden',
            ...spring
         }}
      >
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
               <ScrollArea>
                  {rawKeyword
                     ? loadingItems && !items.length
                        ? "loading"
                        : <ItemList title="搜尋結果" items={items} />
                     : loadingHistories && !histories.length
                        ? "loading"
                        : <RecentItemsSection
                           histories={histories}
                           // items={items.filter(item => item.type === 'recent')}
                           itemOnClickFactory={itemOnClickFactory}
                        />
                  }

                  <ScrollBar orientation="vertical"
                  // todo: add more padding
                  />
               </ScrollArea>
            </PageContainer>
            <PageContainer>
               {courseId1
                  ? <ChartPage
                     key={courseId1}
                     {...{
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
      className={className + " px-1 gap-1 border-[#d9d9d9] border-solid border rounded-md flex flex-row items-center"}
   >
      <IconSearch size={16} stroke={1} color={'#828282'} />
      <input
         // {...restProps}
         className="focus:outline-none  w-full bg-none py-1 text-[#828282] placeholder:text-[#d9d9d9] text-xs  border-none"
         onChange={e => setKeyword(e.target.value)}
         value={keyword} >
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
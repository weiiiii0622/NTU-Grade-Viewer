/**
 * Found out chrome.sidePanel is actually more suitable for this LOL 🤡
 */

import React, { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { History, addMessageListener, getStorage, removeMessageListener, sendRuntimeMessage, setStorage } from "../api";
import styled from 'styled-components';
import { CourseBase, CourseSuggestion } from "../client";
import { useStorage } from "../hooks/useStorage";
import { clamp } from "../utils";
import { IconBook2, IconHistory, TablerIconsProps, IconSearch, IconX } from '@tabler/icons-react';
import { ScrollArea } from "../../@/components/ui/scroll-area";

import "../style.css";
import { createRoot } from "react-dom/client";
import { DialogMessage, addDialogMessageHandler } from "./utils";
import { animated, config, useSpring } from "@react-spring/web";

/* --------------------------------- Config --------------------------------- */

// const WIDTH = 452;
// const HEIGHT = 525;
// const GAP = 8;
import { DIALOG_WIDTH as WIDTH, DIALOG_HEIGHT as HEIGHT, DIALOG_GAP as GAP, DialogAction } from "../config"

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
               throw 'gg'
            setItems(_grades);
            setLoading(false);
         }
      )
      return () => { cancel = true; setLoading(false); }
   }, [rawKeyword]);

   const findHistory = (course: CourseSuggestion) => histories.find(h => h.courseId1 === course.id1)
   const isRecent = (course: CourseSuggestion) => !!findHistory(course)
   const cmp = (a: CourseSuggestion, b: CourseSuggestion) => {
      // sort asending by cmp
      // => first from recent (by negative timeStamp), then by title
      function timeStampWeight(course: CourseSuggestion) {
         const history = findHistory(course);
         return history ? -history.timeStamp : 0;
      }
      return a.title.length - b.title.length + 100 * (timeStampWeight(a) - timeStampWeight(b));
   }

   return [loading, courses.map(course => ({
      type: isRecent(course) ? 'recent' : 'normal',
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
    z-index: 9999;

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
   
   useEffect(()=>{
      window.parent.postMessage({ action: DialogAction.Active, active}, document.referrer);
   }, [active]);

   console.log('position: ', realPos);
   useEffect(() => {
      window.parent.postMessage({ action: DialogAction.Position, position: realPos }, document.referrer);
   }, [realPos]);

   useEffect(() => {
      console.log('effect: ', active, realPos);

      const [x0, y0] = realPos;

      function isInFrame(x: number, y: number) {
         const l = x0, r = l + WIDTH, t = y0, b = t + HEIGHT;
         const inFrame = l <= x && x <= r && t <= y && y <= b;

         console.log(inFrame, "(frame)");
         console.log(l, r, t, b)
         console.log(x, y);
         return inFrame;
      }

      const f = (e: MouseEvent) => {
         const x = e.clientX, y = e.clientY;
         if (!active || !isInFrame(x, y)){
            // console.log('postMessage to ', window.parent.location.href);
            // console.log('which is ', document.referrer);

            window.parent.postMessage({ action: DialogAction.DisablePointer }, document.referrer);
            // window.parent.postMessage({ action: DialogAction.DisablePointer }, document.referrer);
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
            // todo: order of history
            console.log('prev histories: ', histories);

            const timeStamp = Date.now();
            if (!histories)
               histories = [{ courseId1, timeStamp }];
            if (histories.findIndex(h => h.courseId1 === courseId1) === -1)
               histories = [...histories, { courseId1, timeStamp }];
            setStorage({ 'histories': histories })
         })
      }
   }
   let [loadingHistories, histories] = useStorage('histories');
   histories = histories ?? [];
   const [loadingItems, items] = useItems({ histories, rawKeyword, onClickFactory: itemOnClickFactory });

   function goBack() {
      setPageIdx(0);
      setCourseId1(null);
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
            <PageContainer >
               <div className="flex flex-row items-center justify-between mb-4 ml-2" >
                  <h3 className="  text-xl font-bold  text-[#4e4e4e] ">
                     {APP_TITLE}
                  </h3>
                  <span
                     className=" hover:cursor-pointer aspect-square h-6 flex justify-center items-center hover:bg-[#d9d9d9] rounded-full"
                     onClick={() => setActive(false)}
                  >
                     <IconX size={20} stroke={2} color={'#8e8e8e'} />
                  </span>
               </div>
               <SearchInput
                  className="mx-2 mb-6"
                  keyword={rawKeyword} setKeyword={setRawKeyword}
               />
               {rawKeyword
                  ? loadingItems && !items.length
                     ? "loading"
                     : <ItemList title="搜尋結果" items={items} />
                  : loadingHistories && !histories.length
                     ? "loading"
                     : <RecentItemSection
                        histories={histories}
                        itemOnClickFactory={itemOnClickFactory}
                     />
               }
            </PageContainer>
            <PageContainer>
               {courseId1
                  // @ts-ignore
                  ? <ChartPage {...{
                     courseId1,
                     defaultChartType: 'pie',
                     defaultClassId: null,
                     goBack,
                  }} />
                  : null
               }
            </PageContainer>
         </InnerContainer>
      </DialogWrapper>
   );

}


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
   return <div className="min-w-full " >
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
      className={className + " px-1 border-[#d9d9d9] border-solid border rounded-md flex flex-row items-center"}
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

type ChartType = 'pie' | 'bar';

type ChartPageProps = {
   // grades: GradeElement[];
   courseId1: CourseBase['id1'];
   defaultClassId: string | null;
   defaultChartType: ChartType;

   goBack: () => void;
}

export function ChartPage(props: ChartPageProps) {
   const { goBack } = props;

   return <>
      <button onClick={goBack}>back</button>
   </>
}

function RecentItemSection({ histories, itemOnClickFactory }: {
   histories: History[],
   itemOnClickFactory: (courseId1: CourseBase['id1']) => () => void,
}) {

   // todo: loading state

   const [items, setItems] = useState<ItemProps[]>([]);
   useEffect(() => {
      if (!histories) {
         setItems([]);
         return;
      }
      console.log('dispatch')

      let cancel = false;
      const newItems: ItemProps[] = [];
      Promise.all(histories.sort((a, b) => b.timeStamp - a.timeStamp).map(async history => {
         const { courseId1: id1 } = history;
         const [course, error] = await sendRuntimeMessage('service', { funcName: 'getCourseCourseId1Get', args: { id1 } });
         console.log(course, error);
         if (course)
            newItems.push({
               type: 'recent',
               course,
               count: course.grades.length,
               onClick: itemOnClickFactory(course.id1),
            });
      })).then(() => {
         if (!cancel) {
            setItems(newItems);
         } else
            console.log('canceled, not set');

      })

      return () => { console.log('cancel'); cancel = true };
   }, [histories]);


   return <>
      <ItemList
         title="最近搜尋"
         items={items}
      />
   </>
}

type ItemListProps = {
   title: string,
   items: ItemProps[],

   // todo: collapse
   // initialMaxItems: number;
};
function ItemList(props: ItemListProps) {
   const { title, items } = props;

   return <div className="w-full">
      <h4
         className="ml-2 text-xs text-[#a6a6a6] mb-2 font-semibold"
         onClick={() => { console.log('h4') }}
      >
         {title}
      </h4>
      {items.length ?
         <ScrollArea className="flex">
            <ul
               className="flex flex-col items-stretch"
            >
               {
                  items.map((itemProp, i) => (
                     <Item {...itemProp} key={`item-${itemProp.course.id1}`} />
                  ))
               }
            </ul>
         </ScrollArea>
         :
         <div
            className="h-8 flex items-center justify-center text-sm text-[#717171]">
            尚無紀錄
         </div>
         // todo: icon
      }
   </div>
}

type ItemProps = {
   type: 'normal' | 'recent';
   course: CourseBase;
   count: number;
   onClick: () => void;
}

function Item(props: ItemProps) {
   const { type, course, count, onClick } = props;

   // console.log(onClick);

   const iconProps: TablerIconsProps = {
      size: 16,
      color: '#717171',
      stroke: 1.5,
   };

   return <li
      className=' hover:cursor-pointer justify-between rounded-md  flex flex-row p-2 m-0 hover:bg-[#dfdfdf] hover:bg-opacity-[.40]'
      onClick={onClick}
   >
      <div className="flex flex-row items-center p-0 m-0">
         <span className="p-0 m-0 mr-2">
            {type === 'normal'
               ? <IconBook2 {...iconProps} />
               : <IconHistory {...iconProps} />
            }
         </span>
         <span className="mr-1 align-middle text-[#717171] text-sm"> {course.title} </span>
         <span className="align-middle text-[#cccccc] text-xs">{course.id1}</span>
      </div>
      <div className=" text-[#717171] text-xs align-middle flex flex-row items-center">
         {count} 個班次
      </div>
   </li>
}


function Divider() {
   return <>
      <div className="h-0 border-b border-solid border-b-black"></div>
   </>
}

const rootEle = document.querySelector("#root")!;
const dialogRoot = createRoot(rootEle);
document.body.insertBefore(rootEle, null);

dialogRoot.render(<Dialog />);
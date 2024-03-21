import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Tour, TourContent, TourTarget } from "./components/tour";

import "./style.css"
import { getStorage, sendRuntimeMessage, setStorage } from "./api";
import { waitUntil, waitUntilAsync } from "./utils";
import { InnerChartPage } from "./dialog/frame/chartPage";
import { CourseReadWithGrade } from "./client";
import { createPortal } from "react-dom";
import { useStorage } from "./hooks/useStorage";
import { IconX } from "@tabler/icons-react";

export type NTUCoolState = 'normal' | 'chart' | null;

const RE_COURSE = /https:\/\/cool.ntu.edu.tw\/courses\/(\d+)/;
const RE_CHARTS = /https:\/\/cool.ntu.edu.tw\/courses\/(\d+)\/charts/;

function getCourseURL(id: string) {
   return `https://cool.ntu.edu.tw/courses/${id}/`;
}
function getChartsPath(id: string) {
   return `/courses/${id}/charts`
}

function matchCourseId(url: string): [string, true] | [string | undefined, false] {
   let obj = url.match(RE_CHARTS);
   if (obj)
      return [obj[1], true];
   return [url.match(RE_COURSE)?.at(1), false]

}


export async function main() {
   const state = window.NTU_GRADE_VIEWER__APP_INDICATOR.getAttribute('NTUCool');
   if (state) {
      console.log('already running')
      return;
   }

   const [courseId, isCharts] = matchCourseId(window.location.href);
   window.NTU_GRADE_VIEWER__APP_INDICATOR.setAttribute('NTUCool', 'normal');

   if (courseId && window.location.href.endsWith('?charts')) {
      console.log('replace chart')
      showChart(courseId);
      history.replaceState(null, '', getChartsPath(courseId));
   }

   console.log("NTUCOOL", window.location.href)
   window.addEventListener('popstate', (ev) => {
      const [courseId, isCharts] = matchCourseId(window.location.href);
      if (isCharts)
         showChart(courseId);
      else
         window.location.replace(window.location.href);
   })

   if (courseId)
      addSideBarBtn(courseId);
}

function test() {
   const id = "#dashboard_header_container"

   function Test() {
      const [open, setOpen] = useState(true);
      return <Tour open onOpenChange={setOpen}>
         <TourTarget>
            <div style={{ width: 100, height: 100, background: 'red' }}>HI</div>
         </TourTarget>
         <TourContent>
            <div className=" w-[500px] h-[400px] ">
               Content
            </div>
         </TourContent>
      </Tour>
   }


   setTimeout(() => {
      const root = document.createElement("div");
      // createRoot(root).render(
      //    <React.StrictMode>
      //       <Test />
      //    </React.StrictMode>
      // );
      // document.querySelector(id)!.append(root);
   }, 1500)

}


// todo: use syllabus to get lecturer
async function getCourseInfo(id: string) {
   // e.g. "神經解剖學 (MED3057)"
   const RE_COURSE_CODE = /(.+)\s\((.+?)(-(.+))?\)/

   const res = await fetch(`https://cool.ntu.edu.tw/api/v1/courses/${id}`)
      .then(r => r.json());
   const courseCode: string = res.course_code;
   const obj = courseCode.match(RE_COURSE_CODE);
   if (!obj)
      throw `Invalid courseCode: ${courseCode}`;

   const [_, title, id1, __, classId] = obj;
   return { title, id1 };
}

function useCourse(id: string) {

   const [error, setError] = useState(false);
   const [loading, setLoading] = useState(true);
   const [course, setCourse] = useState<CourseReadWithGrade>(null!);

   useEffect(() => {
      let canceled = false;
      setLoading(true);
      getCourseInfo(id).then(async ({ title, id1 }) => {
         if (canceled) {
            setLoading(false);
            return;
         }

         setLoading(true);
         const [course, err] = await sendRuntimeMessage('service',
            { funcName: 'getCourseCourseId1Get', args: { id1, caseSensitive: false } }
         )

         setLoading(false);
         if (canceled)
            return;
         if (err) {
            setError(true)
            return;
         }

         setCourse(course);
      })
   }, [id]);

   return [loading, error, course] as const;
}

function Main(props: { id: string }) {

   const { id } = props;
   const [loading, error, course] = useCourse(id);

   return <>
      hello, {id}
      {loading
         ? "Loading"
         : error ? "Error"
            : <InnerChartPage
               defaultChartType="pie"
               defaultClassKey={null}
               course={course}
            />
      }
   </>
}

// todo: restore main style
// todo: manully revert style
function showChart(id: string) {
   const main = document.querySelector<HTMLElement>('#not_right_side');
   if (!main)
      return;
   main.innerHTML = '';
   main.className = 'flex items-center justify-center flex-1'
   main.parentElement?.setAttribute('style', "display: flex; flex-direction: column")

   const root = document.createElement("div");
   createRoot(root).render(
      <React.StrictMode>
         <Main id={id} />
      </React.StrictMode>
   );
   main.append(root);


   if (window.location.href.endsWith('?charts'))
      document.body.querySelector<HTMLElement>('#application')!.style.visibility = 'visible';
}

// todo: reload
// todo: files page crumbs
// todo: modify crumbs
async function addSideBarBtn(id: string) {

   const sideBar = document.querySelector("#section-tabs")!;
   if (sideBar.querySelector('.charts'))
      return;

   console.log('add!')
   function onBtnClick() {
      history.pushState({ id }, '', `/courses/${id}/charts`)
      showChart(id);
   }

   const newBtn: HTMLElement = sideBar.lastChild!.cloneNode(true) as HTMLElement;
   // const anchor = newBtn.querySelector('a')!
   // anchor.removeAttribute('href')
   // anchor.className = "charts"
   // anchor.innerText = '成績分布'
   // anchor.style.cursor = 'pointer';
   // newBtn.onclick = onBtnClick;
   newBtn.innerHTML = '';
   sideBar.appendChild(newBtn);

   // const root = document.createElement("div");
   console.log(id)
   createRoot(newBtn).render(
      <React.StrictMode>
         <SideBarBtn id={id} />
      </React.StrictMode>
   );
   // document.body.append(new);
}

function SideBarBtn({ id }: { id: string }) {

   const [loading, hasShown] = useStorage('hasShownNTUCoolTour');
   useEffect(() => {
      // if (!loading && !hasShown)
      // setStorage({ hasShownNTUCoolTour: true })
      if (!loading)
         setOpen(!hasShown);
   }, [hasShown, loading]);

   const [open, setOpen] = useState(false);
   console.log('open=', open)


   return <Tour
      open={open}
      onOpenChange={setOpen}>
      <TourTarget asChild>
         <a className="cursor-pointer charts" tabIndex={0}
            onClick={() => {
               history.pushState({ id }, '', `/courses/${id}/charts`)
               showChart(id);
            }}
         >成績分布</a>
      </TourTarget>
      <TourContent>
         <div className=" w-[500px] h-[300px] bg-white rounded-lg overflow-hidden flex justify-center items-center ">
            <div className="absolute cursor-pointer right-4 top-4"
               onClick={() => setOpen(false)}
            >
               <IconX size={20} />
            </div>
            This is our cool feature. Your should definitely try! 🤩
         </div>
      </TourContent>
   </Tour>
}

console.log('hi')
main();
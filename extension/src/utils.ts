import { sendRuntimeMessage } from "./api";
import { Page } from "./models";

import { IGradeChartTooltipData } from "./components/gradeChartToolTip";


/* ---------------------------- Utility Function ---------------------------- */

const getHashCode = (s: string): number => {
   const MAGIC = "TH3_M5G1C_OF_NTU".repeat(3);

   const magic_idx = [];
   let cur = 0;
   for (let i = 0; i < MAGIC.length; i++) {
      cur += MAGIC.charCodeAt(i);
      magic_idx.push(cur);
   }

   const a = [];
   let h = 0;
   for (const idx of magic_idx) {
      const c = s.charCodeAt(idx);
      a.push(c);
      h = (h << 5) - h + c;
      h &= 1 << (63 - 1);
   }
   return h;
}

const waitUntil = async (pred: () => boolean, timeout = 60) => {
   return new Promise<void>((res, rej) => {
      const st = Date.now();
      const f = () => {
         if (Date.now() - st < timeout * 1000)
            if (pred()) res();
            else requestIdleCallback(f);
         else rej();
      };
      requestIdleCallback(f);
   });
}


const toURLQueryString = <T extends Record<string, string | number>>(data: T) => {
   return Object.entries(data)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
}

export { getHashCode, waitUntil, toURLQueryString };

/* ------------------------------- Submit Page ------------------------------ */

const submitPage = async () => {
   if (!window.location.href.startsWith("https://if190.aca.ntu.edu.tw/graderanking/"))
      throw "You should submit on your grade page.";

   if (!document.querySelector(".table-grade .table-rows")) throw "No available grades to submit.";

   const content = await fetch(window.location.href).then((r) => r.text());
   const hashCode = getHashCode(content);

   const page: Page = { content, hashCode };

   let r = await sendRuntimeMessage("service", {
      funcName: "submitPageSubmitPagePost",
      args: { requestBody: page },
   });

   return r;
}

export { submitPage };


/* ------------------------------ Grade Related ----------------------------- */

const fetchGrade = async (course_id1:string, course_id2:string, title:string, class_id:string): Promise<[number, string]> => {
   const [res, err] = await sendRuntimeMessage('service', {
      funcName: 'queryGradesQueryGet',
      args: {
         id1: course_id1,
         id2: course_id2,
         title: title,
         classId: class_id,
      }
   })

   // const [res, err] = await sendRuntimeMessage('service', {
   //    funcName: 'getAllGradesGradeAllGet',
   //    args: {},
   // })
   // if (err) {
   //    return [false, (`Error ${err.status}: ${err.response}`)]
   // }

   if (err) {
      console.log("fetchGrade Error: ", err);
      switch (err.status) {
         case 400:
            return [400, ("Bad Request 400")];
         case 401:
            return [401, ("Unauthorized 401")];
         case 422:
            return [422, ("Validation Error 422")];
         case 500:
            return [500, ("Internal Error 500")];
              
         default:
            return [503, ("Unknown Error 503")]
      }
   }

   console.log("fetchGrade result: ", res)

   // Concatenate all res
   let resString = "";
   res.forEach((cur, idx)=>{resString += (JSON.stringify(cur) + ";");});
   if (resString == "")
      return [404, resString]
   return [200, resString]
 }


const GRADES = ['F', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+']

const getLabel = (seg: {l:number, r:number, value: number}) => {
   return seg.l===seg.r ? GRADES[seg.l] : (GRADES[seg.r]+"~"+GRADES[seg.l]);
}

// Convert Back-end Data to Front-End format
const parseGrade = (res: string) => {
   let rawDatas = res.split(";");
   rawDatas.pop();
   let ret: IGradeChartTooltipData[] = [];

   rawDatas.forEach((rawData, idx) => {
      let score:IGradeChartTooltipData = {title:"", semester:"", lecturer:"", datas:[]};
      const obj = JSON.parse(rawData);
      
      score.title = obj.course.title;
      score.semester = obj.semester;
      score.lecturer = obj.lecturer;
      for(let i = 0; i < obj.segments.length; i++) {
         score.datas.push({value: obj.segments[i].value, label: getLabel(obj.segments[i])});
      }
      score.datas.reverse();
      ret.push(score);
   });

   return ret;
}

export { fetchGrade, parseGrade }
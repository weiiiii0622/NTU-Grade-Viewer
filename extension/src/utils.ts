import { sendRuntimeMessage } from "./api_v2";

import { IGradeChartTooltipData } from "./components/gradeChartToolTip";

function getHashCode(s: string): number {
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

export { getHashCode };

async function waitUntil(pred: () => boolean, timeout = 60) {
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

export { waitUntil };

function toURLQueryString<T extends Record<string, string | number>>(data: T) {
   return Object.entries(data)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
}

export { toURLQueryString };


/* ------------------------------ Grade Related ----------------------------- */

export async function fetchGrade(course_id1:string, course_id2:string, title:string, class_id:string): Promise<[number, string]> {
   const res = await sendRuntimeMessage('service', {
      funcName: 'queryGradesQueryGet',
      args: {
         id1: course_id1,
         id2: course_id2,
         title: title,
         classId: class_id,
      }
   })

   // const res = await sendRuntimeMessage('service', {
   //   funcName: 'getAllGradesGradesAllGet',
   //   args: {}
   // })

   switch (res) {
      //@ts-ignore
      case 401:
         return [401, ("Unauthorized 401")];
      //@ts-ignore
      case 404:
         return [404, ("Not Found 404")];
      //@ts-ignore
      case 422:
         return [422, ("Wrong Params 422")];
      //@ts-ignore
      case 500:
         return [400, ("Internal Error 500")];
               
      default:
         break;
   }

   console.log(res);

   // Concatenate all res
   let resString = "";
   console.log("res: ",res)
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
export const parseGrade = (res: string) => {
   let rawDatas = res.split(";");
   rawDatas.pop();
   let ret: IGradeChartTooltipData[] = [];

   rawDatas.forEach((rawData, idx) => {
      let score:IGradeChartTooltipData = {title:"", semester:"", lecturer:"", datas:[]};
      const obj = JSON.parse(rawData);
      //console.log(obj);
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
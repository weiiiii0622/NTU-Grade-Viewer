import { sendRuntimeMessage } from "./api";
import { Page } from "./models";

import { IGradeChartTooltipData } from "./components/gradeChartToolTip";
import { GradeChart } from "./components/gradeChart";


/* ---------------------------- Utility Function ---------------------------- */

// This function takes an object as a parameter and returns the size of data in bytes
const sizeof = (obj: any) => {
   // Initialize a variable to store the total size
   let totalSize = 0;
   // Get the keys of the object
   let keys = Object.keys(obj);
   // Loop through each key
   for (let key of keys) {
      // Get the value of the key
      let value = obj[key];
      // Check the type of the value
      if (typeof value === "string") {
         // If the value is a string, add its length to the total size
         totalSize += value.length;
      } else if (typeof value === "number") {
         // If the value is a number, add 8 bytes to the total size
         totalSize += 8;
      } else if (typeof value === "boolean") {
         // If the value is a boolean, add 4 bytes to the total size
         totalSize += 4;
      } else if (typeof value === "object" && value !== null) {
         // If the value is an object and not null, recursively call the function and add the result to the total size
         totalSize += sizeof(value);
      }
      // Ignore other types of values such as undefined, function, symbol, etc.
   }
   // Return the total size
   return totalSize;
}

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

export { sizeof, getHashCode, waitUntil, toURLQueryString };

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
   
   console.log("fetchGrade params: ", course_id1, course_id2, title, class_id);

   const [res, err] = await sendRuntimeMessage('service', {
      funcName: 'queryGradesQueryGet',
      args: {
         id1: course_id1,
         id2: course_id2,
         title: title,
         // classId: class_id,         // Filter at front-end
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

   // Filter class_id (class_id="" || class_id=class_id will be selected)

   const filtered_res = res.filter((grades) => {
      return grades.class_id=="" || grades.class_id==class_id;
   });

   console.log("fetchGrade result: ", filtered_res)

   // Concatenate all res
   let resString = "";
   filtered_res.forEach((cur, idx)=>{resString += (JSON.stringify(cur) + ";");});
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
      let score:IGradeChartTooltipData = {title:"", semester:"", lecturer:"", class_id:"", datas:[]};
      const obj = JSON.parse(rawData);
      console.log("size: ", sizeof(obj), obj);
      score.title = obj.course.title;
      score.semester = obj.semester;
      score.class_id = obj.class_id;
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
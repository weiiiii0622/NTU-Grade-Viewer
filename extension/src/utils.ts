import { getStorage, sendRuntimeMessage, setStorage } from "./api";
import { Page } from "./client";

import { IGradeChartTooltipData } from "./components/gradeChartToolTip";

/**
 * @param tabId
 * @param files Pass in the file name without extension and directory, ex. `content_scirpt`.
 */
export async function injectContentScriptIfNotRunning(tabId: number) {
   // ? DOM clobbering
   const key = "NTU_GRADE_VIEWER__APP_INDICATOR";

   const target = { tabId };
   const [{ result: running }] = await chrome.scripting.executeScript({
      target,
      func: (key) => {
         // @ts-ignore
         return !!window[key];
      },
      args: [key],
   });

   if (!running) {
      const files = ["js/vendor.js", "js/content_script.js"];

      await Promise.all([
         chrome.scripting.executeScript({
            target,
            files,
         }),
      ]);
   }
}

/* -------------------------------------------------------------------------- */
/*                              Utility Function                              */
/* -------------------------------------------------------------------------- */

export function clamp(val: number, minVal: number, maxVal: number) {
   return Math.min(maxVal, Math.max(minVal, val));
}

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
};

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
};

const waitUntil = async (pred: () => boolean, timeout = 60) => {
   let next: (fn: () => void) => void;
   try {
      next = window.requestIdleCallback;
   } catch {
      next = setTimeout;
   }

   return new Promise<void>((res, rej) => {
      const st = Date.now();
      const f = () => {
         if (Date.now() - st < timeout * 1000)
            if (pred()) res();
            else next(f);
         else rej();
      };
      next(f);
   });
};

export const waitUntilAsync = async (pred: () => Promise<boolean>, timeout = 60) => {
   let next: (fn: () => void) => void;
   try {
      next = window.requestIdleCallback;
   } catch {
      next = setTimeout;
   }

   return new Promise<void>((res, rej) => {
      const st = Date.now();
      const f = () => {
         pred().then((result) => {
            if (Date.now() - st < timeout * 1000)
               if (result) res();
               else next(f);
            else rej();
         });
      };
      next(f);
   });
};

const toURLQueryString = <T extends Record<string, string | number>>(data: T) => {
   return Object.entries(data)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
};

export { sizeof, getHashCode, waitUntil, toURLQueryString };

/* -------------------------------------------------------------------------- */
/*                                 Submit Page                                */
/* -------------------------------------------------------------------------- */

const submitPage = async () => {
   if (!window.location.href.startsWith("https://if190.aca.ntu.edu.tw/graderanking/"))
      throw "You should submit on your grade page.";

   if (!document.querySelector(".table-grade .table-rows")) throw "No available grades to submit.";

   const content = await fetch(window.location.href).then((r) => r.text());
   const hashCode = getHashCode(content);

   const page: Page = { content, hashCode };

   const cookie = await sendRuntimeMessage("session_id", undefined);
   console.log("cookie: ", cookie);

   let r = await sendRuntimeMessage("service", {
      funcName: "submitPageSubmitPagePost",
      args: { requestBody: page, cookie: cookie },
   });

   return r;
};

export { submitPage };

/* -------------------------------------------------------------------------- */
/*                                Grade Related                               */
/* -------------------------------------------------------------------------- */

const GRADES = ["F", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];

interface IFetchGradeResponse {
   data?: IGradeChartTooltipData[];
   error?: string;
}

const fetchGrade = async (
   course_id1: string,
   course_id2: string,
   title: string,
   class_id: string
): Promise<[number, IFetchGradeResponse]> => {
   console.log("fetchGrade params: ", course_id1, course_id2, title, class_id);

   // Check Cache
   const key = `${course_id1}_${course_id2}_${class_id}`;
   const cache_res = await getCourseLocalCache(key);
   if (cache_res.length != 0) {
      //console.log("From Cache: ", cache_res);
      return [200, { data: cache_res }];
   }

   const [res, err] = await sendRuntimeMessage("service", {
      funcName: "queryGradesQueryGet",
      args: {
         id1: course_id1,
         id2: course_id2,
         title: title,
         // classId: class_id,         // Filter at front-end
      },
   });

   console.log(res, err);

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
            return [400, { error: "Bad Request 400" }];
         case 401:
            return [401, { error: "Unauthorized 401" }];
         case 422:
            return [422, { error: "Validation Error 422" }];
         case 500:
            return [500, { error: "Internal Error 500" }];

         default:
            return [503, { error: "Unknown Error 503" }];
      }
   }

   // Filter class_id
   const filtered_res = res.filter((grades) => {
      return grades.class_id == "" || grades.class_id == class_id;
   });

   //console.log("fetchGrade result: ", filtered_res)

   // Concatenate all res
   let resString = "";
   filtered_res.forEach((cur, idx) => {
      resString += JSON.stringify(cur) + ";";
   });
   if (resString == "") return [404, { data: [] }];

   return [200, { data: await parseGrade(resString, key) }];
};

const getLabel = (seg: { l: number; r: number; value: number }) => {
   return seg.l === seg.r ? GRADES[seg.l] : GRADES[seg.r] + "~" + GRADES[seg.l];
};

// Convert Back-end Data to Front-End format
const parseGrade = async (res: string, key: string) => {
   let rawDatas = res.split(";");
   rawDatas.pop();
   let ret: IGradeChartTooltipData[] = [];

   rawDatas.forEach((rawData, idx) => {
      let score: IGradeChartTooltipData = {
         title: "",
         course_id1: "",
         course_id2: "",
         semester: "",
         lecturer: "",
         class_id: "",
         datas: [],
      };
      const obj = JSON.parse(rawData);
      // console.log("size: ", sizeof(obj), obj);
      score.title = obj.course.title;
      score.course_id1 = obj.course.id1;
      score.course_id2 = obj.course.id2;
      score.semester = obj.semester;
      score.class_id = obj.class_id;
      score.lecturer = obj.lecturer;
      for (let i = 0; i < obj.segments.length; i++) {
         score.datas.push({
            id: i,
            value: obj.segments[i].value,
            label: getLabel(obj.segments[i]),
         });
      }
      score.datas.reverse();
      ret.push(score);
   });

   // Store to cache
   await setCourseLocalCache(ret, key);

   return ret;
};

export { fetchGrade, parseGrade };

/* -------------------------------------------------------------------------- */
/*                                 Score Cache                                */
/* -------------------------------------------------------------------------- */

interface ICourseCache {
   scores: IGradeChartTooltipData;
   cache_time: number;
}

// Set the cache TTL here
const cache_hours = 0;
const cache_minutes = 10;
const cache_seconds = 0;

const setCourseLocalCache = async (scores: IGradeChartTooltipData[], key: string) => {
   // If storage usage > 9MB, clear all cache
   await chrome.storage.local.getBytesInUse(null).then(async (res) => {
      if (res >= 9 * 1000000) {
         await chrome.storage.local.clear();
      }
   });

   chrome.storage.local.set({ [key]: { scores: scores, cache_time: Date.now() } }).then(() => {
      //console.log("Score Stored", { [key]: {scores: scores, cacheTime: Date.now()} });
   });
};

const getCourseLocalCache = async (course: string) => {
   const res = await chrome.storage.local.get(course);
   let TTL = await getStorage("ttl");

   if ((TTL && TTL.cache_time < Date.now() - TTL.value) || !TTL) {
      const [ttl, _2] = await sendRuntimeMessage("service", {
         funcName: "getTtlTimeToLiveGet",
         args: {},
      });
      await setStorage({
         ttl: { value: ttl ? ttl * 1000 : cache_minutes * 60 * 1000, cache_time: Date.now() },
      });
      TTL = await getStorage("ttl");
   }

   // In case any error
   if (!TTL) {
      await setStorage({ ttl: { value: cache_minutes * 60 * 1000, cache_time: Date.now() } });
      TTL = await getStorage("ttl");
   }

   // console.log("Final ttl: ", TTL);

   if (res[course]) {
      if (res[course].cache_time > Date.now() - TTL!.value) {
         return res[course].scores;
      }
      // console.log("Score Outdated:", res[course]);
      chrome.storage.local.remove(course);
   }
   return [];
};

export { setCourseLocalCache, getCourseLocalCache };

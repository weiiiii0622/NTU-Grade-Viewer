import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { fetchAppProxy } from "./api";
import { getStorage, removeStorage, sendRuntimeMessage, sendTabMessage } from "./api_v2";
import { DefaultService, OpenAPI } from "./client";
import { catchErrorCodes } from "./client/core/request";


OpenAPI['BASE'] = APP_URL

const Popup = () => {
   let studentId = "";
   const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

   const handleSubmitScore = () => {
      chrome.tabs.query(
         { active: true, currentWindow: true },
         async function (tabs: chrome.tabs.Tab[]) {
            const tab: chrome.tabs.Tab = tabs[0];

            if (tab.id) {
               const { } = await sendTabMessage(tab.id, 'submitPage', {})
               setHasSubmitted(true);
            }
         }
      );
   };

   const [exampleFetched, setExampleFetched] = useState(false);
   const [result, setResult] = useState('');
   async function fetchExample(): Promise<[boolean, string]> {
      // const res = await sendRuntimeMessage('service', {
      //    funcName: 'queryGradesQueryGradesGet',
      //    args: {
      //       id1: 'CSIE1214'
      //    }
      // })
      const [res, err] = await sendRuntimeMessage('service', {
         funcName: 'getAllGradesGradeAllGet',
         args: {},
      })
      if (err) {
         return [false, (`Error ${err.status}: ${err.response}`)]
      }

      // Concatenate all res
      let resString = "";
      res.forEach((cur, idx) => { resString += (JSON.stringify(cur) + ";"); });
      console.log(resString);

      return [true, (JSON.stringify(res[0]))]
   }


   async function f() {
      const [state, res] = await fetchExample();
      setResult(res);
   }
   useEffect(() => {
      f();
   }, [])

   const [msg, setMsg] = useState('');

   return (
      <>
         <h3>NTU 選課小幫手 V2</h3>
         <div>
            <button onClick={handleSubmitScore}>上傳成績</button>
            {hasSubmitted && (
               <h4>感謝您的分享! 歡迎使用小幫手</h4>
            )}
         </div>

         <div><button onClick={() => removeStorage('token')}>Clear Token</button></div>
         <div>Fetching Example (CSIE1212):
            <div>
               {result}
            </div>
            <button onClick={() => { f() }}>Retry</button>
         </div>
         <div>
            <button onClick={async () => {
               let flag = true;
               for (let i = 0; i < 20; i++) {
                  const [s] = await fetchExample();
                  if (!s) flag = false;
               }
               setMsg(flag ? '成功' : '失敗')
            }}>壓力測試</button>
            {msg}
         </div>
      </>
   );
};

const root = createRoot(document.getElementById("root")!);

root.render(
   <React.StrictMode>
      <Popup />
   </React.StrictMode>
);

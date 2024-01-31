import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { fetchAppProxy } from "./api";

const Popup = () => {
   let studentId = "";
   const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

   useEffect(() => {
      const checkAuth = async () => {
         // const r = await fetchAppProxy(`/auth/${studentId}`, { method: "GET", body: page });
      };
   }, []);

   const handleSubmitScore = () => {
      chrome.tabs.query(
         { active: true, currentWindow: true },
         function (tabs: chrome.tabs.Tab[]) {
            const tab: chrome.tabs.Tab = tabs[0];

            if (tab.id) {
               chrome.tabs.sendMessage(tab.id, { action: "submit-score" }, (msg) => {
                  console.log("submit-score result:", msg);
                  if (msg.status == 200) {
                     // Successfully Submit Grade
                     setHasSubmitted(true);
                  } else {
                     throw "上傳成績失敗！";
                  }
               });
            }
         }
      );
   };

   return (
      <>
         <h3>NTU 選課小幫手</h3>
         {hasSubmitted ? (
            <h4>感謝您的分享! 歡迎使用小幫手</h4>
         ) : (
            <button onClick={handleSubmitScore}>上傳成績</button>
         )}
      </>
   );
};

// const root = createRoot(document.getElementById("root")!);

// root.render(
//    <React.StrictMode>
//       <Popup />
//    </React.StrictMode>
// );

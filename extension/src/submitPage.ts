import { fetchApp, fetchAppProxy } from "./api";
import { ServiceFuncName, sendRuntimeMessage } from "./api_v2";
import { Page } from "./models";
import { getHashCode } from "./utils";

async function submitPage() {
   if (!window.location.href.startsWith("https://if190.aca.ntu.edu.tw/graderanking/"))
      throw "You should submit on your grade page.";

   if (!document.querySelector(".table-grade .table-rows")) throw "No available grades to submit.";

   const content = await fetch(window.location.href).then((r) => r.text());
   const hashCode = getHashCode(content);

   const page: Page = { content, hashCode };
   console.log(page);
   const r = await fetchAppProxy("/page", { method: "POST", body: page });
   console.log("submitPage result: ", r);

   // if (r.status === "success") {
   //     console.log("success; userId:", r.data.userId);
   // } else {
   //     console.log("fail; ", r.data);
   // }

   return r;
}

async function submitPageV2() {
   if (!window.location.href.startsWith("https://if190.aca.ntu.edu.tw/graderanking/"))
      throw "You should submit on your grade page.";

   if (!document.querySelector(".table-grade .table-rows")) throw "No available grades to submit.";

   const content = await fetch(window.location.href).then((r) => r.text());
   const hashCode = getHashCode(content);

   const page: Page = { content, hashCode };
   // const r  = await sendRuntimeMessage("service", {
   const y: { x: 1 } = { x: 1 };
   let r = await sendRuntimeMessage("service", {
      funcName: "submitPagePagePost",
      args: { requestBody: page },
   });
   console.log("submitPage result: ", r);

   return r;
}

export { submitPage, submitPageV2 };

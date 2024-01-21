import { fetchApp, fetchAppProxy } from "./api";
import { getHashCode } from "./utils";

async function submitPage() {
    if (!window.location.href.match("https://if190.aca.ntu.edu.tw/graderanking/"))
        throw "You should submit on your grade page.";

    if (!document.querySelector(".table-grade .table-rows")) throw "No available grades to submit.";

    const content = await fetch(window.location.href).then((r) => r.text());
    const hashCode = getHashCode(content);

    const page = { content, hashCode };
    const r = await fetchAppProxy("/page", { method: "POST", body: page });
    if (r.status === "success") {
        console.log("success; userId:", r.data.userId);
    } else {
        console.log("fail; ", r.data);
    }
}

export { submitPage };

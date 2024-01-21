import { submitPage } from "./submitPage";



const handleSubmitScore = async (sendResponse: (response?: any) => void) => {
  const res = await submitPage();
  console.log("res", res);
  sendResponse({
    data: res.data,
    status: res.res.status
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if(msg.action == "submit-score"){
    console.log(`Current Window Location: ${window.location.href}`);
    try {
      handleSubmitScore(sendResponse);
      return true;
    } catch (error) {
      console.log("SubmitScore Error:", error);
      sendResponse(`SubmitScore Error: ${error}`);
    }
    
  }
});

// if (window.location.href.match('https://if190.aca.ntu.edu.tw/graderanking/')) {
//   setTimeout(() => setProxyFunc(submitPage));
// }

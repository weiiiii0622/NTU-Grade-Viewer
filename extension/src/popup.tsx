import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import { grey, red, green } from '@mui/material/colors';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import LoadingButton from '@mui/lab/LoadingButton';

import SendIcon from '@mui/icons-material/Send';

import { fetchAppProxy } from "./api";
import { getStorage, removeStorage, sendRuntimeMessage, sendTabMessage } from "./api_v2";
import { DefaultService, OpenAPI } from "./client";
import { catchErrorCodes } from "./client/core/request";

import { ISnackBarProps } from "./components/snackBar";

OpenAPI['BASE'] = APP_URL

const Popup = () => {

   const [msg, setMsg] = useState<string>('');
   const [isAuth, setIsAuth] = useState<boolean>(false);
   const [isLoading, setIsLoading] = useState<boolean>(false);

   const sendSnackBarMessage = (msg: ISnackBarProps) => {
      chrome.tabs.query(
         { active: true, currentWindow: true },
         async function (tabs: chrome.tabs.Tab[]) {
            const tab: chrome.tabs.Tab = tabs[0];

            if (tab.id) {
               sendTabMessage(tab.id, 'snackBar', msg);
            }
         }
      );      
   }

   const handleSubmitScore = () => {
      setIsLoading(true);
      chrome.tabs.query(
         { active: true, currentWindow: true },
         async function (tabs: chrome.tabs.Tab[]) {
            const tab: chrome.tabs.Tab = tabs[0];

            if(!tab.url?.startsWith("https://if190.aca.ntu.edu.tw/graderanking")){
               console.log("Wrong Page SubmitGrade")
               sendSnackBarMessage({msg:"請確認您的頁面位於「成績與名次查詢及探索學分申請系統」！", severity: "error", action: true});
            }
            else if (tab.id) {
               try {
                  const { message } = await sendTabMessage(tab.id, 'submitPage', {})
                  console.log("msg:", message);
                  setIsAuth(true);
                  sendSnackBarMessage({msg:"註冊成功！歡迎使用 NTU 選課小幫手！", severity: "success", action: true});
                  
               } catch (error) {
                  console.log("error:", error);
               }
            }
            setIsLoading(false);
         }
      );
   };

   const checkToken = async () => {
      let token = await getStorage('token');
         if (token) {
            setIsAuth(true);
         }
         else {
            setIsAuth(false);
         }
   }

   useEffect(() => {
      if(isAuth == false)
         checkToken();
   }, [isAuth])
   
   return (
   <>
      <Box sx={{ width: "100%", height: "100%", mt: "10px", display: "flex", flexDirection: "column", justifyContent: 'center', alignContent: 'center', alignItems: 'center', bgcolor: "#F8F8F8" }}>
         <Box sx={{height: "20%"}}>
            <Typography variant="h5" color={{ color: grey[700] }} fontWeight="bold">
               NTU 選課小幫手
            </Typography>
            <div><button onClick={() => {removeStorage('token'); setIsAuth(false);}}>Clear Token</button></div>
         </Box>
         <Box sx={{width: "100%", height: "50%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
            Hi
         </Box>
         <Box sx={{width: "100%", height: "20%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
            <Box sx={{width: "50%", height: "100%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
               <Typography variant="body1" color={{ color: grey[700] }}  fontWeight="bold">
                  目前狀態：
               </Typography>
               <Typography variant="body1" color={ isAuth ? { color: green[500] } : { color: red[500] }} fontWeight="bold">
                  {isAuth ? "已註冊" : "尚未註冊"}
               </Typography>
            </Box>
            <Box sx={{width: "50%", height: "100%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
               <LoadingButton
                  size="small"
                  onClick={handleSubmitScore}
                  color="info"
                  loadingPosition="end"
                  loading={isLoading}
                  variant="outlined"
                  endIcon={<SendIcon />}
               >
                  <span>上傳成績</span>
               </LoadingButton>
            </Box>
         </Box>
         <Box sx={{width: "100%", height: "10%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center', '& hr': {mx: 1,} }}>
            <Typography variant="caption" display="block" color={{ color: grey[600] }} fontWeight="bold">
               Made By
            </Typography>
            <Avatar sx={{ width: 25, height: 25, font: "menu", ml: "8px", mr: "2px" }}>Wei</Avatar>
            <Avatar sx={{ width: 25, height: 25, font: "menu", ml: "2px", mr: "2px" }}>KC</Avatar>
            <Divider orientation="vertical" flexItem />
            <Link href="https://google.com/" target="_blank" underline="hover" variant="caption" fontWeight="bold">
               {'使用教學'}
            </Link>
            <Divider orientation="vertical" flexItem />
            <Link href="https://google.com/" target="_blank" underline="hover" variant="caption" fontWeight="bold">
               {'FAQ'}
            </Link>
            <Divider orientation="vertical" flexItem />
            <Link href="https://google.com/" target="_blank" underline="hover" variant="caption" fontWeight="bold">
               {'隱私權政策'}
            </Link>
         </Box>       
      </Box>
   </>
   );
};

const root = createRoot(document.getElementById("root")!);

root.render(
   <React.StrictMode>
      <Popup />
   </React.StrictMode>
);

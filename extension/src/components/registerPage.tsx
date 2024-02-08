import React, { useEffect, useRef, useState } from "react";

import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import { grey, red, green } from '@mui/material/colors';

import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';

import { sendTabMessage, getStorage, removeStorage } from "../api_v2";
import { ISnackBarProps } from "./snackBar";

interface IRegisterPageProps {
   reset: boolean
}

export const RegisterPage: React.FC<IRegisterPageProps>  = ( {reset} ) => {

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
            
            console.log(tab.url);
            if(!tab.url?.startsWith("https://if190.aca.ntu.edu.tw/graderanking") || tab.url?.startsWith("https://if190.aca.ntu.edu.tw/graderanking/Error")){
               console.log(tab.url)
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
                  alert("發生錯誤！請重新整理頁面再試一次！");
                  sendSnackBarMessage({msg:"發生錯誤！請重新整理頁面再試一次！", severity: "error", action: true});
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
      if(isAuth == false || reset)
         checkToken();
   }, [isAuth, reset])


	return (
		<>
			<Box sx={{width: "100%", height: "70%"}}>

			</Box>
			<Box sx={{width: "100%", height: "30%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
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
		</>
	);
}
import React, { useEffect, useRef, useState } from "react";

import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { grey, red, green } from '@mui/material/colors';
import TextField from '@mui/material/TextField';

import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import SearchIcon from '@mui/icons-material/Search';

import { sendRuntimeMessage, sendTabMessage, getStorage, removeStorage } from "../api_v2";
import { ISnackBarProps } from "./snackBar";
import { IGradeChartTooltipData } from "./gradeChartToolTip";
import { GradeChart } from "./gradeChart";


const GRADES = ['F', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+']

export const SearchPage = () => {

	const [isAuth, setIsAuth] = useState<boolean>(false);
   const [isLoading, setIsLoading] = useState<boolean>(false);
	const [status, setStatus] = useState<number>(0);
	const [hasGrade, setHasGrade] = useState<boolean>(false);
	const [grades, setGrades] = useState<IGradeChartTooltipData[]>([]);

	const [course_id1, setCourse_id1] = useState<string>("CSIE1212");
	const [course_id2, setCourse_id2] = useState<string>("902 10750");
	const [title, setTitle] = useState<string>("");
	const [class_id, setClass_id] = useState<string>("02");

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

	async function fetchGrade(): Promise<[number, string]> {
		const res = await sendRuntimeMessage('service', {
			funcName: 'queryGradesQueryGet',
			args: {
				id1: course_id1,
				id2: course_id2,
				//title: title,
				classId: class_id,
			}
		})

		switch (res) {
		//@ts-ignore
		case 400:
			return [400, ("Internal Error 400")];
		//@ts-ignore
		case 401:
			return [401, ("Unauthorized 401")];
		//@ts-ignore
		case 404:
			return [404, ("Not Found 404")];
		//@ts-ignore
		case 422:
			return [422, ("Wrong Params 422")];
		
		default:
			break;
		}

		//console.log(res);

		// Concatenate all res
		let resString = "";
		res.forEach((cur, idx)=>{resString += (JSON.stringify(cur) + ";");});
		if (resString == "")
			return [404, resString]
		return [200, resString]
   }

	const getLabel = (seg: {l:number, r:number, value: number}) => {
		return seg.l===seg.r ? GRADES[seg.l] : (GRADES[seg.r]+"~"+GRADES[seg.l]);
	}
  
	// Convert Back-end Data to Front-End format
	const parseGrade = (res: string) => {
		let rawDatas = res.split(";");
		rawDatas.pop();
		let ret: IGradeChartTooltipData[] = [];
  
		rawDatas.forEach((rawData, idx) => {
		  	let score:IGradeChartTooltipData = {semester:"", lecturer:"", datas:[]};
			const obj = JSON.parse(rawData);
			console.log(obj);
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
  
	const handleFetchGrade = async () => {
		setIsLoading(true);
		if(course_id1.length == 0 || course_id2.length == 0){
			sendSnackBarMessage({msg:"請填寫「課號」與「識別碼」！", severity:"error", action:true});
			return
		}
		console.log("Input Valid", course_id1, course_id2, class_id)
		const [statusCode, res] = await fetchGrade();
		let datas: IGradeChartTooltipData[] = [];
		
		//console.log(res);

		setStatus(statusCode);

		if(statusCode == 401) 
			setIsAuth(false);
		else {
			if(statusCode === 200){
				setHasGrade(true);
				setGrades(parseGrade(res));
				sendSnackBarMessage({msg:"成功！", severity:"success", action:true});
			}
			else {
				sendSnackBarMessage({msg:"目前沒有此項課程的成績！", severity:"warning", action:true});
				setHasGrade(false);
			}
			setIsLoading(false);
		}
		return datas
	}

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
			<Box sx={{width: "100%", height: "20%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
				{
					isAuth ?
						(
							<Box
								component="form"
								sx={{
								'& .MuiTextField-root': { m: 1 }, width: "100%", height: "100%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center'
								}}
								autoComplete="off"
							>
								<TextField
									required
									color="primary"
									id="course_id1-input"
									label="課號"
									size="small"
									InputLabelProps={{
										shrink: true,
									}}
									error={course_id1.length==0}
									sx={{width: '17ch'}}
									defaultValue="CSIE1212"
									onChange={e=>setCourse_id1(e.target.value)}
									onKeyDown={e=>course_id1.length!=0 && e.key === 'Enter' && e.preventDefault()}
								/>
								<TextField
									required
									color="primary"
									id="course_id2-input"
									label="識別碼"
									size="small"
									error={course_id2.length==0}
									InputLabelProps={{
										shrink: true,
									}}
									sx={{width: '17ch'}}
									defaultValue="902 10750"
									onChange={e=>setCourse_id2(e.target.value)}
									onKeyDown={e=>course_id2.length!=0 && e.key === 'Enter' && e.preventDefault()}
								/>
								<TextField
									color="primary"
									id="class_id-input"
									label="班次"
									size="small"
									InputLabelProps={{
										shrink: true,
									}}
									sx={{width: '10ch'}}
									defaultValue="02"
									onChange={e=>setClass_id(e.target.value)}
									onKeyDown={e=>class_id.length!=0 && e.key === 'Enter' && e.preventDefault()}
								/>
								<IconButton aria-label="search" onClick={handleFetchGrade}>
									<SearchIcon />
								</IconButton>
							</Box>
						)
					:
						<Typography variant="body1" color={{ color: red[500] }} fontWeight="bold">
							請先去註冊頁面上傳成績！
						</Typography>
				}
			</Box>
			<Box sx={{width: "100%", height: "85%", display: "flex", flexDirection: "column", justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
				{
					!isAuth || isLoading || !hasGrade ?
						<Skeleton variant="rounded" animation="wave" height="80%" width="75%" />
					:
						<GradeChart grades={grades} title={title==""?"暫無課名":title} width={270} height={170}/>
				}	
			</Box>
		</>
	);
}
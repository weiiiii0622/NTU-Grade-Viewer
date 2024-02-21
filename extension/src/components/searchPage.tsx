import React, { useEffect, useState } from "react";

import { Box } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { grey, red, green } from '@mui/material/colors';
import TextField from '@mui/material/TextField';
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

import { sendTabMessage, getStorage } from "../api";
import { ISnackBarProps } from "./snackBar";
import { IGradeChartTooltipData } from "./gradeChartToolTip";
import { GradeChart } from "./gradeChart";
import { fetchGrade, parseGrade } from "../utils";


interface ISearchPageProps {
	reset: boolean
}

export const SearchPage: React.FC<ISearchPageProps> = ({ reset }) => {

	const [isAuth, setIsAuth] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isPageReady, setIsPageReady] = useState<boolean>(false);
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


	const handleFetchGrade = async () => {
		setIsLoading(true);
		if (course_id1.length == 0 || course_id2.length == 0) {
			sendSnackBarMessage({ msg: "請填寫「課號」與「識別碼」！", severity: "error", action: true });
			return
		}

		const [statusCode, res] = await fetchGrade(course_id1, course_id2, "", class_id);
		let datas: IGradeChartTooltipData[] = [];

		setStatus(statusCode);

		if (statusCode == 401)
			setIsAuth(false);
		else {
			if (statusCode === 200) {
				setHasGrade(true);
				setGrades(res.data!);
				sendSnackBarMessage({ msg: "成功！", severity: "success", action: true });
			}
			else {
				// todo: should identify no results or other error
				sendSnackBarMessage({ msg: "目前沒有此項課程的成績！", severity: "warning", action: true });
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
		setIsPageReady(true)
	}

	useEffect(() => {
		if (isAuth == false || reset)
			checkToken();
	}, [isAuth, reset])

	return (
		<>
			<Box sx={{ width: "100%", height: "20%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
				{

					!isPageReady ?
						<></>
						: isAuth ?
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
										error={course_id1.length == 0}
										sx={{ width: '17ch' }}
										defaultValue="CSIE1212"
										onChange={e => setCourse_id1(e.target.value)}
										onKeyDown={e => course_id1.length != 0 && e.key === 'Enter' && e.preventDefault()}
									/>
									<TextField
										required
										color="primary"
										id="course_id2-input"
										label="識別碼"
										size="small"
										error={course_id2.length == 0}
										InputLabelProps={{
											shrink: true,
										}}
										sx={{ width: '17ch' }}
										defaultValue="902 10750"
										onChange={e => setCourse_id2(e.target.value)}
										onKeyDown={e => course_id2.length != 0 && e.key === 'Enter' && e.preventDefault()}
									/>
									<Tooltip
										title="若無班次則留空"
										arrow
										slotProps={{
											popper: {
												sx: {
													[`& .${tooltipClasses.arrow}`]: {
														color: (theme) => theme.palette.primary.main
													},
													[`& .${tooltipClasses.tooltip}`]: {
														backgroundColor: (theme) => theme.palette.primary.main
													}
												},
												modifiers: [
													{
														name: 'offset',
														options: {
															offset: [0, -7],
														},
													},
												],
											},
										}}
									>
										<TextField
											color="primary"
											id="class_id-input"
											label="班次"
											size="small"
											InputLabelProps={{
												shrink: true,
											}}
											sx={{ width: '10ch' }}
											defaultValue="02"
											onChange={e => setClass_id(e.target.value)}
											onKeyDown={e => class_id.length != 0 && e.key === 'Enter' && e.preventDefault()}
										/>
									</Tooltip>
									<IconButton aria-label="search" onClick={handleFetchGrade}>
										<SearchIcon />
									</IconButton>
								</Box>
							)
							:
							<Typography variant="body1" color={{ color: red[500] }} fontWeight="bold">
								請先點選左上角選單，前往註冊頁面上傳成績！
							</Typography>
				}
			</Box>
			<Box sx={{ width: "100%", height: "85%", display: "flex", flexDirection: "column", justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
				{
					!isAuth || isLoading || !hasGrade ?
						<Skeleton variant="rounded" animation="wave" height="80%" width="75%" />
						:
						<GradeChart grades={grades} defaultTitle={title == "" ? "暫無課名" : title} width={270} height={170} />
				}
			</Box>
		</>
	);
}
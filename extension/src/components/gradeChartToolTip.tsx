import { useEffect, useState } from 'react';

import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { grey } from '@mui/material/colors';

import BarChartIcon from '@mui/icons-material/BarChart';
import IconButton from '@mui/material/IconButton';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { GradeChart } from './gradeChart';
import { GradeElement } from '../client';
import { IChartData } from './gradeChart';


export interface IGradeChartTooltipProps {
	grades: IGradeChartTooltipData[],
	title?: string,		// From 課程網
}

export interface IGradeChartTooltipData {
	title?: string,	 // From back-end
	semester: string,
	lecturer: (string|null),
	datas: IChartData[]
}

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
			backgroundColor: "#F8F8F8",
			boxShadow: theme.shadows[1],
      color: 'rgba(0, 0, 0, 0.87)',
      fontSize: theme.typography.pxToRem(10),
      border: '1px solid #dadde9',
			maxWidth: 'none',
    },
  }));


export const GradeChartToolTip: React.FC<IGradeChartTooltipProps> = ({grades, title}) => {

	const [datas, setDatas] = useState<IChartData[]>(grades[0].datas);
	const [lecturer, setLecturer] = useState<string|null>(grades[0].lecturer);
	const [semester, setSemester] = useState<string|null>(grades[0].semester);
	const [value, setValue] = useState<number>(0);


	useEffect(() => {
		setLecturer(grades[value].lecturer);
		setDatas(grades[value].datas);
		setSemester(grades[value].semester);
	}, [value])
	

	// TEST ONLY
	// const datas = [
	// 	{ value: 30.5, label: 'A+' },
	// 	{ value: 15, label: 'A' },
	// 	{ value: 20, label: 'A-' },
	// 	{ value: 5, label: 'B+' },
	// 	{ value: 12, label: 'B' },
	// 	{ value: 16, label: 'B-' },
	// 	{ value: 5, label: 'C+' },
	// 	{ value: 6, label: 'C' },
	// 	{ value: 7, label: 'C-' },
	// 	{ value: 21, label: 'F' },
	// ];
	

	return (
		<HtmlTooltip
			title={
				<>
					<Box sx={{ display: "flex", justifyContent: 'space-evenly', alignContent: 'center', alignItems: 'center', mt: "5px", bgcolor: "#F8F8F8" }}>
						<Typography variant="subtitle2" color={{ color: grey[700] } } fontWeight="bold">
							{title}
						</Typography>
						<Typography variant="subtitle2" color={{ color: grey[700] } } fontWeight="bold">
							{semester} {lecturer==""?"查無授課教授":lecturer}
						</Typography>
					</Box>

					<Box sx={{ display: "flex", bgcolor: "#F8F8F8" }}>

						<IconButton aria-label="before" disabled={value==0} onClick={() => {setValue((value>0?value-1:0));}}>
							<NavigateBeforeIcon />
						</IconButton>
						
						<GradeChart datas={datas} />

						<IconButton aria-label="next" disabled={value==grades.length-1} onClick={() => {setValue((value<grades.length-1?value+1:value));}}>
							<NavigateNextIcon />
						</IconButton>

					</Box>
					
				</>
			}
			
			placement="top"
			TransitionComponent={Zoom}
			leaveDelay={200}
			disableFocusListener
			onClose={()=>{console.log("CLOSE")}}
			sx={{
				zIndex: 20,
			}}
		>
			<BarChartIcon sx={{color:"#01579b"}}/>
		</HtmlTooltip>
	)
}
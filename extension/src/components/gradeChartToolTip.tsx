import { useState } from 'react';

import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import BarChartIcon from '@mui/icons-material/BarChart';

import { GradeChart } from './gradeChart';
import { GradeElement } from '../client';
import { IChartData } from './gradeChart';

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
			backgroundColor: theme.palette.common.white,
			boxShadow: theme.shadows[1],
      color: 'rgba(0, 0, 0, 0.87)',
      fontSize: theme.typography.pxToRem(12),
      border: '1px solid #dadde9',
			maxWidth: 'none',
    },
  }));


export const GradeChartToolTip = () => {

	const [datas, setDatas] = useState<IChartData[]>([]);
	const [value, setValue] = useState<number>(0);

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

	// TODO: Fetch Course Info From DataBase

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
					<GradeChart datas={datas} />
				</>
			}
			placement="top"
			TransitionComponent={Zoom}
			sx={{
				zIndex: 2,
			}}
		>
			<BarChartIcon sx={{color:"#01579b"}}/>
		</HtmlTooltip>
	)
}
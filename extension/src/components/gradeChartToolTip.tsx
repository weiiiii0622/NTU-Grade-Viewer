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
	defaultTitle: string,		// From 課程網 (only used when back-end has no title)
}

export interface IGradeChartTooltipData {
	title: string,	    		// From back-end
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


export const GradeChartToolTip: React.FC<IGradeChartTooltipProps> = ({grades, defaultTitle}) => {

	return (
		<HtmlTooltip
			title={
				<>
					<GradeChart grades={grades} defaultTitle={defaultTitle} width={300} height={200}/>
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
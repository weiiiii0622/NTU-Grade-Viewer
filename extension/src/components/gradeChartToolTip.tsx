import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Zoom from '@mui/material/Zoom';

import { GradeChart } from './gradeChart';

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


interface Grade {
	semester: string, // 112-1
	data: {
		label: string,  // A+, A+~B- ...
		value: number   // 30 (without %)
	}
}


export const GradeChartToolTip = () => {

	// TODO: Fetch Course Info From DataBase

	// TEST ONLY
	const datas = [
		{ value: 30.5, label: 'A+' },
		{ value: 15, label: 'A' },
		{ value: 20, label: 'A-' },
		{ value: 5, label: 'B+' },
		{ value: 12, label: 'B' },
		{ value: 16, label: 'B-' },
		{ value: 5, label: 'C+' },
		{ value: 6, label: 'C' },
		{ value: 7, label: 'C-' },
		{ value: 21, label: 'F' },
	];
	

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
			<div>Grade</div>
		</HtmlTooltip>
	)
}
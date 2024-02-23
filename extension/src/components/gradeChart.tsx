import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { grey } from '@mui/material/colors';

import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import IconButton from '@mui/material/IconButton';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { DefaultizedPieValueType } from '@mui/x-charts';
import { PieChart as MuiPieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import { axisClasses, AxisConfig } from '@mui/x-charts';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { IGradeChartTooltipData } from './gradeChartToolTip';

enum GradeChartType {
	Pie,
	Bar
}

export interface IScoreChartProps {
	grades: IGradeChartTooltipData[],
	defaultTitle: string,		// From 課程網 (only used when back-end has no title)
	width: number,
	height: number
}

export interface IChartData {
	id?: number,
	value: number,
	label: string
}


const sizing = {
	margin: {
		left: 20,
		right: 80,
		top: 20,
		bottom: 20,
	},
};


const getArcLabel = (params: DefaultizedPieValueType): string => {
	return `${params.value!}%`;
};

const valueFormatter = (params: number) => { return `${params}%` };

export const GradeChart: React.FC<IScoreChartProps> = ({ grades, defaultTitle, width, height }) => {

	const [graphType, setGraphType] = React.useState<GradeChartType>(GradeChartType.Pie);
	const [datas, setDatas] = useState<IChartData[]>(grades[0].datas);
	const [title, setTitle] = useState<string | null>(grades[0].title);
	const [lecturer, setLecturer] = useState<string | null>(grades[0].lecturer);
	const [semester, setSemester] = useState<string | null>(grades[0].semester);
	const [class_id, setClass_id] = useState<string | null>(grades[0].class_id);
	const [value, setValue] = useState<number>(0);


	const handleGradeChartType = (
		event: React.MouseEvent<HTMLElement>,
		newType: GradeChartType,
	) => {
		if (newType !== null) setGraphType(newType);
	}

	// todo: I think this does not need effect
	useEffect(() => {
		if (grades[value].title == "")
			setTitle(defaultTitle);
		else
			setTitle(grades[value].title);
		setLecturer(grades[value].lecturer);
		setDatas(grades[value].datas);
		setSemester(grades[value].semester);
		setClass_id(grades[value].class_id);
	}, [value])

	return (
		<>
			<Box sx={{ width: "100%", height: "50%", display: "flex", flexDirection: "column", justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
				<Box sx={{ display: "flex", justifyContent: 'space-evenly', alignContent: 'center', alignItems: 'center', mt: "5px", bgcolor: "#F8F8F8" }}>
					<Typography variant="subtitle2" color={{ color: grey[700] }} sx={{ mr: "20px" }} fontWeight="bold">
						{title}
					</Typography>
					<Typography variant="subtitle2" color={{ color: grey[700] }} fontWeight="bold">
						{semester}{class_id != "" ? ` ${class_id}班` : ""} {lecturer == "" ? "查無授課教授" : lecturer}
					</Typography>
					<ToggleButtonGroup
						value={graphType}
						exclusive
						//size="small"
						//color="primary"
						onChange={handleGradeChartType}
						aria-label="text alignment"
						sx={{
							height: "25px",
							width: "26px",
							ml: "20px",
							mr: "20px"
						}}
					>
						<ToggleButton value={GradeChartType.Pie} aria-label="left aligned" sx={{ padding: "6px" }}>
							<PieChartIcon />
						</ToggleButton>
						<ToggleButton value={GradeChartType.Bar} aria-label="right aligned" sx={{ padding: "6px" }}>
							<BarChartIcon />
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>
				<Box sx={{ display: "flex", bgcolor: "#F8F8F8" }}>
					<IconButton aria-label="before" disabled={value == 0} onClick={() => { setValue((value > 0 ? value - 1 : 0)); }}>
						<NavigateBeforeIcon />
					</IconButton>

					{
						graphType == GradeChartType.Pie ?
							<PieChart
								{...{ datas, width, height }}
							/>
							:
							<BarChart
								{...{ datas, width, height }}
							/>
					}
					<IconButton aria-label="next" disabled={value == grades.length - 1} onClick={() => { setValue((value < grades.length - 1 ? value + 1 : value)); }}>
						<NavigateNextIcon />
					</IconButton>
				</Box>
			</Box>
		</>

	)
}

export function PieChart({
	datas, width, height
}: {
	datas: IChartData[],
	width: number,
	height: number,
}) {
	return <MuiPieChart
		series={[
			{
				data: [...datas],
				highlightScope: { faded: 'global', highlighted: 'item' },
				arcLabel: getArcLabel,
				arcLabelMinAngle: 25,
				valueFormatter: (params) => { return `${params.value}%` }
			},
		]}
		sx={{
			[`& .${pieArcLabelClasses.root}`]: {
				fill: 'white',
				fontWeight: 'normal',
				fontSize: 10,
			},
		}}
		colors={['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1']}
		slotProps={{
			legend: {
				direction: 'column',
				position: { vertical: 'middle', horizontal: 'right' },
				padding: { top: 40, bottom: 40, left: 0, right: 0 },
				labelStyle: {
					fontSize: 12,
				},
				itemMarkWidth: 7,
				itemMarkHeight: 7,
				markGap: 5,
				itemGap: 10,
			},
		}}
		width={width}
		height={height}
		{...sizing}
	/>
}

export function BarChart({
	datas, width, height
}: {
	datas: IChartData[],
	width: number,
	height: number,
}) {
	return <MuiBarChart
		// @ts-ignore
		dataset={datas}
		xAxis={[
			{ scaleType: 'band', dataKey: 'label', barGapRatio: 0.1 } as AxisConfig<'band'>,
		]}
		series={[
			{ dataKey: 'value', label: '', valueFormatter, highlightScope: { faded: 'global', highlighted: 'item' }, },
		]}
		width={width}
		height={height}
		// yAxis={[
		// 	{
		// 		label: '人數 (%)',
		// 	},
		// ]}
		slotProps={{ legend: { hidden: true } }}
		sx={{
			[`.${axisClasses.left} .${axisClasses.label}`]: {
				transform: 'translate(-0px, 0)',
			},
		}}
	/>
}

import React from 'react';
import { DefaultizedPieValueType } from '@mui/x-charts';
import { PieChart, pieArcLabelClasses  } from '@mui/x-charts/PieChart';

export interface IScoreChartProps {
	datas: IChartData[];
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
  width: 300,
  height: 200,
};

const getArcLabel = (params: DefaultizedPieValueType): string => {
  return `${params.value!}%`;
};

export const GradeChart: React.FC<IScoreChartProps> = ( {datas} ) => {
	return (
		<>
			<PieChart
				series={[
					{
						data: [...datas],
						highlightScope: { faded: 'global', highlighted: 'item' },
						arcLabel: getArcLabel,
						arcLabelMinAngle: 25,
					},
				]}
				sx={{
					[`& .${pieArcLabelClasses.root}`]: {
						fill: 'white',
						fontWeight: 'normal',
						fontSize: 10,
					},
				}}
				colors={['#f94144','#f3722c','#f8961e','#f9844a','#f9c74f','#90be6d','#43aa8b','#4d908e','#577590','#277da1']}
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
				{...sizing}
			/>
		</>

	)
}
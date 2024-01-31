import { LoadingIcon } from "./loadingIcon";
import { GradeChartToolTip } from "./gradeChartToolTip";

import { red } from '@mui/material/colors';
import ErrorIcon from '@mui/icons-material/Error';
import Tooltip from '@mui/material/Tooltip';

import React, { useState } from "react";

interface IGradeChartLoader {
  auth?: boolean
}

export const GradeChartLoader: React.FC<IGradeChartLoader> = ({ auth }) => {

  const [isLoading, setIsLoading] = useState<boolean>(true);

  setTimeout(() => {
    setIsLoading(false);
  }, 1000);

  return (
    <>
      {
        !auth ? 
          (
            <Tooltip title="請先上傳您的成績！" placement="top">
              <ErrorIcon sx={{ color: red[500] }} />
            </Tooltip>
          )
          
        :
          isLoading ?
            <LoadingIcon stroke="#A0A0A0" stopColor="#A0A0A0"/>
          :
            <GradeChartToolTip />
      }
    </>
  );
}

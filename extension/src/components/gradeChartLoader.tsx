import { LoadingIcon } from "./loadingIcon";
import { GradeChartToolTip } from "./gradeChartToolTip";
import { getStorage, removeStorage, sendRuntimeMessage } from "../api_v2";

import { red } from '@mui/material/colors';
import ErrorIcon from '@mui/icons-material/Error';
import Tooltip from '@mui/material/Tooltip';

import React, { useState } from "react";

interface IGradeChartLoader {
  auth?: boolean,
  title: (string | undefined),                    // 課程名稱
  course_id1: (string | undefined),               // 課號
  course_id2: (string | undefined),               // 識別碼
  lecturer: (string | undefined),
}

// type GradeElement = {
//   course_id1: string;            // 課號
//   semester: string;              
//   lecturer: (string | null);
//   class_id: (string | null);     // 班次
//   segments: Array<Segment>;      
//   id?: string;                   //  backend-related
// };

export const GradeChartLoader: React.FC<IGradeChartLoader> = ({ auth, title, course_id1, course_id2, lecturer }) => {

  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function fetchExample(): Promise<[boolean, string]> {
    const res = await sendRuntimeMessage('service', {
       funcName: 'queryGradesQueryGradesGet',
       args: {
          id1: course_id1,
          id2: course_id2,
          title: title,
          //classId: '',
       }
    })

    //@ts-ignore
    if (res === 401) {
       return [false, ("Unauthorized 401")]
    }
    return [true, (JSON.stringify(res[0]))]
 }

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

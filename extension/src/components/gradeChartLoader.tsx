import { LoadingIcon } from "./loadingIcon";
import { GradeChartToolTip } from "./gradeChartToolTip";
import { IChartData } from './gradeChart';
import { IGradeChartTooltipData } from "./gradeChartToolTip";
import { fetchGrade, parseGrade } from "../utils";
import { getStorage, removeStorage, sendRuntimeMessage } from "../api_v2";

import { red, grey } from '@mui/material/colors';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import React, { useState, useEffect } from "react";

interface IGradeChartLoaderProps {
  auth: boolean,
  title: (string | undefined),                    // 課程名稱 (From 課程網, only used when back-end has no title)
  course_id1: (string | undefined),               // 課號
  course_id2: (string | undefined),               // 識別碼
  class_id: (string | undefined),                 // 班次
  lecturer: (string | undefined),
}

const GRADES = ['F', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+']

export const GradeChartLoader: React.FC<IGradeChartLoaderProps> = ({ auth, title, course_id1, course_id2, class_id, lecturer }) => {

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<number>(0);
  const [hasGrade, setHasGrade] = useState<boolean>(false);
  const [grades, setGrades] = useState<IGradeChartTooltipData[]>([]);
  const [isAuth, setIsAuth] = useState<boolean>(auth);

  const handleFetchGrade = async () => {
    const [statusCode, res] = await fetchGrade(course_id1!, course_id2!, title!, class_id!);
    let datas: IGradeChartTooltipData[] = [];
    //console.log(res);

    setStatus(statusCode);

    if(statusCode == 401) 
      setIsAuth(false);
    else {
      if(statusCode === 200){
        setHasGrade(true);
        setGrades(parseGrade(res));
      }
      else {
        setHasGrade(false);
      }
      setIsLoading(false);
    }
    return datas
  }

  useEffect(() => {
    if(isAuth)
      handleFetchGrade();
  }, [])

  return (
    <>
      {
        !isAuth ? 
          (
            <Tooltip title="請先點選小工具上傳您的成績！" placement="top">
              <UploadFileIcon sx={{ color: red[500] }} />
            </Tooltip>
          )
        :
          isLoading ?
            <LoadingIcon stroke="#A0A0A0" stopColor="#A0A0A0"/>
          :
            hasGrade ?
              <Badge badgeContent={grades.length} color="primary">
                <GradeChartToolTip grades={grades} defaultTitle={title==undefined?"暫無課名":title}/>
              </Badge>
            :
              status!=404 ?
              (
                <Tooltip title="系統發生錯誤 請稍後再試！" placement="top">
                  <ErrorIcon sx={{ color: red[500] }} />
                </Tooltip>
              )
              :
              (
                <Tooltip title="目前沒有此堂課程的資料！" placement="top">
                  <HelpIcon sx={{ color: grey[600] }} />
                </Tooltip>
              )
      }
    </>
  );
}

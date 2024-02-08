import { LoadingIcon } from "./loadingIcon";
import { GradeChartToolTip } from "./gradeChartToolTip";
import { IChartData } from './gradeChart';
import { IGradeChartTooltipData } from "./gradeChartToolTip";
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
  title: (string | undefined),                    // 課程名稱
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

  async function fetchGrade(): Promise<[number, string]> {
    const res = await sendRuntimeMessage('service', {
       funcName: 'queryGradesQueryGet',
       args: {
          id1: course_id1,
          id2: course_id2,
          title: title,
          //classId: '',
       }
    })
    // const res = await sendRuntimeMessage('service', {
    //    funcName: 'queryGradesQueryGradesGet',
    //    args: {
    //       id1: course_id1,
    //       id2: course_id2,
    //       title: title,
    //       classId: class_id,
    //    }
    // })
    // const res = await sendRuntimeMessage('service', {
    //   funcName: 'getAllGradesGradesAllGet',
    //   args: {}
    // })

    switch (res) {
      //@ts-ignore
      case 400:
        return [400, ("Internal Error 400")];
      //@ts-ignore
      case 401:
        return [401, ("Unauthorized 401")];
      //@ts-ignore
      case 404:
        return [404, ("Not Found 404")];
      //@ts-ignore
      case 422:
        return [422, ("Wrong Params 422")];
    
      default:
        break;
    }

    //console.log(res);

    // Concatenate all res
    let resString = "";
    res.forEach((cur, idx)=>{resString += (JSON.stringify(cur) + ";");});
    if (resString == "")
      return [404, resString]
    return [200, resString]
  }


  const getLabel = (seg: {l:number, r:number, value: number}) => {
    return seg.l===seg.r ? GRADES[seg.l] : (GRADES[seg.r]+"~"+GRADES[seg.l]);
  }

  // Convert Back-end Data to Front-End format
  const parseGrade = (res: string) => {
    let rawDatas = res.split(";");
    rawDatas.pop();
    let ret: IGradeChartTooltipData[] = [];

    rawDatas.forEach((rawData, idx) => {
      let score:IGradeChartTooltipData = {semester:"", lecturer:"", datas:[]};
      const obj = JSON.parse(rawData);
      console.log(obj);
      score.semester = obj.semester;
      score.lecturer = obj.lecturer;
      for(let i = 0; i < obj.segments.length; i++) {
        score.datas.push({value: obj.segments[i].value, label: getLabel(obj.segments[i])});
      }
      score.datas.reverse();
      ret.push(score);
    });

    return ret;
  }

  const handleFetchGrade = async () => {
    const [statusCode, res] = await fetchGrade();
    let datas: IGradeChartTooltipData[] = [];
    console.log(res);

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
  
  // FOR TESTING
  // setTimeout(() => {
  //   setIsLoading(false);
  // }, 1000);

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
                <GradeChartToolTip grades={grades} title={title==undefined?"暫無課名":title}/>
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

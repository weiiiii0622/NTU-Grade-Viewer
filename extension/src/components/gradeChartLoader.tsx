import { LoadingIcon } from "./loadingIcon";
import { GradeChartToolTip } from "./gradeChartToolTip";
import { IChartData } from './gradeChart';
import { IGradeChartTooltipData } from "./gradeChartToolTip";
import { getStorage, removeStorage, sendRuntimeMessage } from "../api_v2";

import { red } from '@mui/material/colors';
import ErrorIcon from '@mui/icons-material/Error';
import Tooltip from '@mui/material/Tooltip';

import React, { useState, useEffect } from "react";

interface IGradeChartLoader {
  auth: boolean,
  title: (string | undefined),                    // 課程名稱
  course_id1: (string | undefined),               // 課號
  course_id2: (string | undefined),               // 識別碼
  lecturer: (string | undefined),
}

const GRADES = ['F', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+']

export const GradeChartLoader: React.FC<IGradeChartLoader> = ({ auth, title, course_id1, course_id2, lecturer }) => {

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasGrade, setHasGrade] = useState<boolean>(false);
  const [grades, setGrades] = useState<IGradeChartTooltipData[]>([]);
  const [isAuth, setIsAuth] = useState<boolean>(auth);

  async function fetchExample(): Promise<[boolean, string]> {
    // const res = await sendRuntimeMessage('service', {
    //    funcName: 'queryGradesQueryGradesGet',
    //    args: {
    //       id1: course_id1,
    //       id2: course_id2,
    //       title: title,
    //       //classId: '',
    //    }
    // })
    const res = await sendRuntimeMessage('service', {
      funcName: 'getAllGradesGradesAllGet',
      args: {}
    })
    //@ts-ignore
    if (res === 401) {
       return [false, ("Unauthorized 401")]
    }

    // Concatenate all res
    let resString = "";
    res.forEach((cur, idx)=>{resString += (JSON.stringify(cur) + ";");});
    console.log(resString);

    return [true, resString]
  }


  const getLabel = (seg: {l:number, r:number, value: number}) => {
    if(seg.l === seg.r){
      return GRADES[seg.l];
    }
    else{
      return (GRADES[seg.r]+"~"+GRADES[seg.l])
    }
  }

  // Convert Back-end Data to Front-End interface
  const parseGrade = (res: string) => {
    let rawDatas = res.split(";");
    rawDatas.pop();
    console.log(rawDatas);
    let ret: IGradeChartTooltipData[] = [];

    rawDatas.forEach((rawData, idx) => {
      let score:IGradeChartTooltipData = {semester:"", lecturer:"", datas:[]};
      const obj = JSON.parse(rawData);

      score.semester = obj.semester;
      score.lecturer = obj.lecturer;
      for(let i = 0; i < obj.segments.length; i++) {
        const label = getLabel(obj.segments[i]);
        score.datas.push({value: obj.segments[i].value, label: label});
      }
      score.datas.reverse();
      ret.push(score);
    });

    return ret;
  }

  const fetchGrade = async () => {
    const [state, res] = await fetchExample();
    let datas: IGradeChartTooltipData[] = [];
    console.log(res);
    // 401
    if(state == false) 
      setIsAuth(false);
    else {
      if(res.length === 0)
        setHasGrade(false);
      else {
        setHasGrade(true);
        setGrades(parseGrade(res));
      }
      setIsLoading(false);
    }
    return datas
  }


  useEffect(() => {
    fetchGrade();
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
            <Tooltip title="請先上傳您的成績！" placement="top">
              <ErrorIcon sx={{ color: red[500] }} />
            </Tooltip>
          )
        :
          isLoading ?
            <LoadingIcon stroke="#A0A0A0" stopColor="#A0A0A0"/>
          :
            hasGrade ?
              <GradeChartToolTip grades={grades} title={title==undefined?"暫無課名":title}/>
            :
            (
              <Tooltip title="目前沒有此堂課程的資料！" placement="top">
                <ErrorIcon sx={{ color: red[500] }} />
              </Tooltip>
            )
      }
    </>
  );
}

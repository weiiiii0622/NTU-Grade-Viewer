import { LoadingIcon } from "./loadingIcon";

import React, { useState } from "react";

interface IGradeChart {
  auth?: boolean
}

export const GradeChart: React.FC<IGradeChart> = ({ auth }) => {

  const [isLoading, setIsLoading] = useState<boolean>(true);
  return (
    <>
      {
        !auth ? 
          <span>Need To Submit Grade</span>
        :
          isLoading ?
            <LoadingIcon stroke="#A0A0A0" stopColor="#A0A0A0"/>
          :
            <span>Grade</span>
      }
    </>
  );
}

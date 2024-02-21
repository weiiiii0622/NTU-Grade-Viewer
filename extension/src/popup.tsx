import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Box } from '@mui/material';
import { grey, red, green } from '@mui/material/colors';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LoginIcon from '@mui/icons-material/Login';
import MenuIcon from '@mui/icons-material/Menu';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';

import { RegisterPage } from "./components/registerPage";
import { SearchPage } from "./components/searchPage";


import { removeStorage } from "./api";
import { OpenAPI } from "./client";
import { injectContentScriptIfNotRunning } from "./utils";
import { AdminAvatarWithToolTip } from "./components/adminAvatar";

OpenAPI['BASE'] = APP_URL

/* ------------------------------ Inject Script ----------------------------- */

chrome.tabs.query(({ active: true })).then(([tab]) => {
   injectContentScriptIfNotRunning(tab.id!);
})


/* -------------------------------- Component ------------------------------- */

const Popup = () => {

   const [reset, setReset] = useState<boolean>(false);
   const [page, setPage] = useState<number>(0);

   const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
   const open = Boolean(anchorEl);
   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
   };
   const handleClose = (page: number) => {
      setPage(page);
      setAnchorEl(null);
   };

   (
      async () => {
         console.log("Hi");
      }
   )()

   return (
      <>
         <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: 'center', alignContent: 'center', alignItems: 'center', bgcolor: "#F8F8F8" }}>

            {/* Header */}
            <Box sx={{ width: "100%", height: "10%", mt: "10px", mb: "20px", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
               <Box sx={{ width: "20%", height: "100%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
                  <IconButton
                     size="medium"
                     color="inherit"
                     aria-label="menu"
                     id="menu-button"
                     aria-controls={open ? 'basic-menu' : undefined}
                     aria-haspopup="true"
                     aria-expanded={open ? 'true' : undefined}
                     onClick={handleClick}
                  >
                     <MenuIcon />
                  </IconButton>
                  <Menu
                     id="basic-menu"
                     anchorEl={anchorEl}
                     open={open}
                     onClose={handleClose}
                     MenuListProps={{
                        'dense': true,
                        'aria-labelledby': 'menu-button',
                     }}
                  >
                     <MenuItem onClick={() => handleClose(0)}>
                        <ListItemIcon>
                           <LoginIcon fontSize="small" />
                        </ListItemIcon>
                        註冊
                     </MenuItem>
                     <MenuItem onClick={() => handleClose(1)}>
                        <ListItemIcon>
                           <SearchIcon fontSize="small" />
                        </ListItemIcon>
                        尋找課程
                     </MenuItem>
                  </Menu>
               </Box>
               <Box sx={{ width: "80%", height: "100%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
                  <Typography variant="h5" color={{ color: grey[700] }} fontWeight="bold">
                     NTU 選課小幫手
                  </Typography>
                  <Tooltip title="首次使用請點擊下方「使用教學」！" placement="bottom" arrow >
                     <HelpOutlineIcon color="action" sx={{ "pb": "4px", "ml": "2px" }} />
                  </Tooltip>
               </Box>
               <Box sx={{ width: "20%", height: "100%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
                  <Tooltip title="發生未知錯誤時按我重整" arrow>
                     <IconButton
                        size="medium"
                        color="inherit"
                        aria-label="reset"
                        id="reset-button"
                        onClick={() => { removeStorage('token'); setReset(true); }}
                     >
                        <ReplayIcon />
                     </IconButton>
                  </Tooltip>
               </Box>
            </Box>

            {/* Body */}
            <Box sx={{ width: "100%", height: "80%" }}>
               {
                  page == 0 ?
                     <RegisterPage reset={reset} />
                     : page == 1 ?
                        <SearchPage reset={reset} />
                        :
                        <RegisterPage reset={reset} />
               }
            </Box>

            {/* Footer */}
            <Box sx={{ width: "100%", height: "10%", display: "flex", flexDirection: "row", justifyContent: 'center', alignContent: 'center', alignItems: 'center', '& hr': { mx: 1, } }}>
               <Typography variant="caption" display="block" color={{ color: grey[600] }} fontWeight="bold">
                  Made By
               </Typography>
               {/* <Tooltip title="您好！" placement="top" arrow
                  slotProps={{
                     popper: {
                        sx: {
                           [`& .${tooltipClasses.arrow}`]: {
                              color: (theme) => theme.palette.warning.light
                           },
                           [`& .${tooltipClasses.tooltip}`]: {
                              backgroundColor: (theme) => theme.palette.warning.light
                           }
                        },
                        modifiers: [
                           {
                              name: 'offset',
                              options: {
                                 offset: [0, -7],
                              },
                           },
                        ],
                     },
                  }}
               >
                  <Avatar sx={{ width: 25, height: 25, font: "menu", ml: "8px", mr: "2px" }}>Wei</Avatar>
               </Tooltip> */}
               {/* <Tooltip title="歡迎使用！" placement="top" arrow
                  slotProps={{
                     popper: {
                        sx: {
                           [`& .${tooltipClasses.arrow}`]: {
                              color: (theme) => theme.palette.secondary.main
                           },
                           [`& .${tooltipClasses.tooltip}`]: {
                              backgroundColor: (theme) => theme.palette.secondary.main
                           }
                        },
                        modifiers: [
                           {
                              name: 'offset',
                              options: {
                                 offset: [0, -7],
                              },
                           },
                        ],
                     },
                  }}
               >
                  <Avatar sx={{ width: 25, height: 25, font: "menu", ml: "2px", mr: "2px" }}>KC</Avatar>
               </Tooltip> */}
               {Math.random() > 0.5  // we are a fair team 😤
                  ?
                  <>
                     <AdminAvatarWithToolTip enableLink name="Wei" githubId="weiiiii0622" toolTipProps={{ title: 'Wei, NTU B10 CSIE' }} presetIdx={0} />
                     <AdminAvatarWithToolTip enableLink name="KC" githubId="kc0506" toolTipProps={{ title: 'KC, NTU B10 MED' }} presetIdx={1} />
                  </>
                  : <>
                     <AdminAvatarWithToolTip enableLink name="KC" githubId="kc0506" toolTipProps={{ title: 'KC, NTU B10 MED' }} presetIdx={1} />
                     <AdminAvatarWithToolTip enableLink name="Wei" githubId="weiiiii0622" toolTipProps={{ title: 'Wei, NTU B10 CSIE' }} presetIdx={0} />
                  </>
               }
               <Divider orientation="vertical" flexItem />
               <Link href="https://weiiiii0622.github.io/NTU-Grade-Viewer/Tutorial/" target="_blank" underline="hover" variant="caption" fontWeight="bold">
                  {'使用教學'}
               </Link>
               <Divider orientation="vertical" flexItem />
               <Link href="https://weiiiii0622.github.io/NTU-Grade-Viewer/FAQ/" target="_blank" underline="hover" variant="caption" fontWeight="bold">
                  {'FAQ'}
               </Link>
               <Divider orientation="vertical" flexItem />
               <Link href="https://weiiiii0622.github.io/NTU-Grade-Viewer/Privacy-Policy/" target="_blank" underline="hover" variant="caption" fontWeight="bold">
                  {'隱私權政策'}
               </Link>
            </Box>
         </Box>
      </>
   );
};

const root = createRoot(document.getElementById("root")!);

root.render(
   <React.StrictMode>
      <Popup />
   </React.StrictMode>
);


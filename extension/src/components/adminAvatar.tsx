
import { Avatar, SxProps, Theme } from '@mui/material';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { forwardRef } from 'react';
import styled from 'styled-components';

type Admin = 'Wei' | 'KC';



() => {

    <Tooltip title="您好！" placement="top" arrow
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
    </Tooltip>
}


type AdminAvatorProps = {
    name: Admin,
    githubId: string,
    useProfile?: boolean,
    enableLink?: boolean,
}

export const AdminAvatar = forwardRef<HTMLDivElement, AdminAvatorProps>((props, ref) => {

    const { name, githubId, useProfile = true, enableLink = true, ...restProps } = props;


    const inner = useProfile
        ? <img
            // styles copied from MUI
            style={{
                width: "100%",
                height: "100%",
                textAlign: "center",
                objectFit: "cover",
                color: "transparent",
                textIndent: "10000px",
            }}
            src={`https://github.com/${githubId}.png`} />
        : name;

    return <Avatar
        ref={ref}
        sx={{ width: 25, height: 25, font: "menu", ml: "2px", mr: "2px" }}
        {...restProps}
    >
        {enableLink
            ? <a style={{ height: '100%', margin: 0, padding: 0 }} href={`https://github.com/${githubId}`} target='_blank'>{inner}</a>
            : inner
        }
    </Avatar>
});


const toolTipPresets: SxProps<Theme>[] = [
    {
        [`& .${tooltipClasses.arrow}`]: {
            color: (theme) => theme.palette.secondary.main
        },
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: (theme) => theme.palette.secondary.main
        }
    },
    {
        [`& .${tooltipClasses.arrow}`]: {
            color: (theme) => theme.palette.warning.light
        },
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: (theme) => theme.palette.warning.light
        }
    }
]

export function AdminAvatarWithToolTip(props: AdminAvatorProps & {
    toolTipProps: Partial<TooltipProps>, presetIdx?: 0 | 1
}) {

    const { toolTipProps, presetIdx, ...restProps } = props;

    return <Tooltip title={toolTipProps.title ?? restProps.name} placement="top" arrow
        slotProps={{
            popper: {
                sx: presetIdx
                    ? toolTipPresets[presetIdx]
                    : {
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
        {...toolTipProps}
    >
        <AdminAvatar {...restProps} />
    </Tooltip>
}


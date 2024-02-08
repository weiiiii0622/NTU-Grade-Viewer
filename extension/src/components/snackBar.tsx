import React from 'react';
import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

export interface ISnackBarProps {
    msg: string,
    severity: 'error' | 'info' | 'success' | 'warning',
    action?: true | false,
}

export const SnackBar: React.FC<ISnackBarProps> = ( {msg, severity, action} ) => {

    const [open, setOpen] = React.useState(false);
 
    const handleClick = () => {
       setOpen(true);
    };
 
    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    useEffect(() => {
        setOpen(true);
    }, [action])
    

	return (
		<>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert
                onClose={handleClose}
                severity={severity}
                variant="filled"
                sx={{ width: '100%' }}
                >
                    {msg}
                </Alert>
            </Snackbar>
		</>
	)
}
import React from "react";
import { createRoot } from "react-dom/client";
import { addMessageListener } from "./api";
import { SnackBar, ISnackBarProps } from "./components/snackBar";

/* ------------------------------ Popup Message ----------------------------- */

addMessageListener('snackBar', (msg: ISnackBarProps) => {
	const root = document.createElement("div");
	createRoot(root).render(
		<React.StrictMode>
			<SnackBar msg={msg.msg} severity={msg.severity} action={msg.action} />
		</React.StrictMode>
	);
	document.body.append(root);
})
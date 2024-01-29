import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const PERM: chrome.permissions.Permissions = {
  permissions: ["scripting"],
  origins: ["<all_urls>"],
};

function Options() {
  /**
   * This seems unnecessary
   */
  const [allowScripting, setAllowScripting] = useState(false);

  useEffect(() => {
    chrome.permissions.contains(PERM, (res) => {
      setAllowScripting(res);
    });
  }, []);

  function onClick() {
    chrome.permissions.request(PERM, (granted) => {
      setAllowScripting(granted);
    });
  }

  return (
    <>
      <div>
        <button onClick={onClick}>Enable scripting on all sites</button>
      </div>
      <div>
        Enabled:
        {allowScripting ? "yes" : "no"}
      </div>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);

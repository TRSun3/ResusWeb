/**
 * RoboTRAC Visualization Tool
 *
 * ChkShowTopArrow.js
 *
 * Top Arrow tool
 */

// Imports
import * as React from "react";

/*
 * Injecting script into iframe
 */
function injectScriptIntoIframe(iframe, jsId, jsText) {
  if (!iframe) {
    return;
  }
  if (iframe.contentWindow.document.getElementById(jsId)) {
    // Already exists
    removeScriptFromIframe(iframe, jsId);
  }
  let script = iframe.contentWindow.document.createElement("script");
  script.setAttribute("id", jsId);
  script.innerHTML = jsText;
  iframe.contentWindow.document.body.appendChild(script);
}

/*
 * Removing script from iframe
 */
function removeScriptFromIframe(iframe, jsId) {
  if (!iframe) {
    return;
  }
  let scriptToBeRemoved = iframe.contentWindow.document.getElementById(jsId);
  if (scriptToBeRemoved) {
    let sheetParent = scriptToBeRemoved.parentNode;
    if (sheetParent) sheetParent.removeChild(scriptToBeRemoved);
  }
}

const iframeIds = ["title1", "title2"];

/*
 * Inject top arrow script
 *
 * Called in componentDidMount() in SliderDemo.js when iframes are loaded
 */
export function injectShowTopArrowScript() {
  let jsText = document.getElementById("showTopArrowScript").innerHTML;
  jsText += " addCanvasAndHiddenInput();";
  for (let i = 0; i < iframeIds.length; i++) {
    let iframe = document.getElementById(iframeIds[i]);
    if (iframe) {
      injectScriptIntoIframe(
        iframe,
        "showTopArrowScript_" + iframeIds[i],
        jsText
      );
    }
  }
}

/*
 * Check show top arrow
 *
 * Handles changes to show top arrow
 */
export function ChkShowTopArrow() {
  const [checked, setChecked] = React.useState(false);
  const handleChange = () => {
    setChecked(!checked);
    for (let i = 0; i < iframeIds.length; i++) {
      let iframe = document.getElementById(iframeIds[i]);
      if (iframe) {
        let showTopArrow =
          iframe.contentWindow.document.getElementById("showTopArrow");
        if (!showTopArrow) {
          continue;
        }
        if (!checked) {
          showTopArrow.value = "true";
        } else {
          showTopArrow.value = "false";
        }
      }
    }
  };

  return (
    <div>
      <Checkbox
        label=" Show Top Arrow"
        value={checked}
        onChange={handleChange}
      />
    </div>
  );
}

/*
 * Show top arrow checkbox
 */
const Checkbox = ({ label, value, onChange }) => {
  return (
    <label>
      <input type="checkbox" checked={value} onChange={onChange} />
      {label}
    </label>
  );
};

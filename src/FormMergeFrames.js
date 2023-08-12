/**
 * RoboTRAC Visualization Tool
 *
 * FormMergeFrames.js
 * 
 * Merges the two frames to show similarities and differences between the two models
 * Note: does not work when simultaneous rotation is enabled, consumed by rotating()
 */

// Imports
import * as React from "react";

/*
 * Script that imports three.js
 *
 * Reference: https://threejs.org/docs/index.html#manual/en/introduction/Installation
 */
const threeJSheadScript =
  "{ " +
  '"imports": { ' +
  '"three": "https://unpkg.com/three@0.154.0/build/three.module.js", ' +
  '"three/addons/": "https://unpkg.com/three@0.154.0/examples/jsm/" ' +
  "} " +
  "} ";

/*
 * Script for merging the two frames
 * The new frame has everything in frame 1 (Ground Truth): data, object, K3DInstance
 * Steps:
 * 1. Get frame 2 data from iframe 2 ("title2") to var data1 (getRawDataFromFrame)
 * 2. Assign frame 1 object (Ground Truth) to a new texture using color and opacity params
 * 3. Create a new K3DInstance from loading frame 2 data (Pred Aug)
 * 4. From the new K3DInstance, get the frame 2 object and assign it a new texture 
 * 5. Add this frame 2 object to the first K3DInstance, it will be drawn there with the existing frame 1 object
 * 6. Clean up, set other background and grid colors, remove duplicate elements created with the second K3DInstance:
 *    canvas, legend, control panel, grid labels
 */
function getMergeFramesScript(frameColor1, frameOpacity1, frameColor2, frameOpacity2, backgroundColor, gridColor) {
    return "var K3DInstance1; " + // Define a new k3d instance
        "let objectId0 = Object.keys(K3DInstance.getWorld().ObjectsById)[0]; " +
        "let object0 = K3DInstance.getObjectById(objectId0); " +

        // Reference: https://threejs.org/docs/#api/en/textures/DataTexture   
        "const width = 512; " +
        "const height = 512; " +

        "const size = width * height; " +
        "const dataArr = new Uint8Array( 4 * size ); " +
        "const color = new THREE.Color( 0x" + frameColor1.substring(1) + " ); " + 

        "for ( let i = 0; i < size; i ++ ) { " +
            "const stride = i * 4; " +
            "dataArr[ stride ] = Math.floor( color.r * 255 ); " +
            "dataArr[ stride + 1 ] = Math.floor( color.g * 255 ); " +
            "dataArr[ stride + 2 ] = Math.floor( color.b * 255 ); " +
            "dataArr[ stride + 3 ] = " + (255 * parseFloat(frameOpacity1)).toString() + "; " +  // Opacity
        "} " +
        // Use the buffer to create a DataTexture, assign it to the object
        "const texture = new THREE.DataTexture( dataArr, width, height ); " +
        "texture.needsUpdate = true; " +
        "object0.material.uniforms.colormap.value = texture; " +

        // Load the frame2 data (var data1) into a new K3DInstance
        "K3DInstance1 = new lib.CreateK3DAndLoadBinarySnapshot( " +
            "_base64ToArrayBuffer(data1), " +
            "document.getElementById('canvasTarget'), " +
        "); " +

        "K3DInstance1.then(function(K3DInstance1) { " +
            "let objectId = Object.keys(K3DInstance1.getWorld().ObjectsById)[0]; " +
            "let object = K3DInstance1.getObjectById(objectId); " +

            // Reference: https://threejs.org/docs/#api/en/textures/DataTexture                
            "const width = 512; " +
            "const height = 512; " +

            "const size = width * height; " +
            "const dataArr = new Uint8Array( 4 * size ); " +
            "const color = new THREE.Color( 0x" + frameColor2.substring(1) + " ); " + // Color

            "for ( let i = 0; i < size; i ++ ) { " +
                "const stride = i * 4; " +
                "dataArr[ stride ] = Math.floor( color.r * 255 ); " +
                "dataArr[ stride + 1 ] = Math.floor( color.g * 255 ); " +
                "dataArr[ stride + 2 ] = Math.floor( color.b * 255 ); " +
                "dataArr[ stride + 3 ] = " + (255 * parseFloat(frameOpacity2)).toString() + "; " +  // Opacity             
            "} " +
            // Use the buffer to create a DataTexture, assign it to the object
            "const texture = new THREE.DataTexture( dataArr, width, height ); " +
            "texture.needsUpdate = true; " +
            "object.material.uniforms.colormap.value = texture; " +

            // Add the second object (Pred Aug) to the first K3DInstance where it is rendered
            "let e = {id: objectId, type: 'json'}; " +
            "K3DInstance.addOrUpdateObject(e, object); " +

            "K3DInstance.setMenuVisibility(false); " +
            "K3DInstance.setClearColor(0x" + backgroundColor.substring(1) + "); " +
            "K3DInstance.setGridColor(0x" + gridColor.substring(1) + "); " +

            // Remove the duplicate elements in the second K3D instance
            "let canvasTarget = document.getElementById('canvasTarget'); " +
            "canvasTarget.class = ' k3d-target'; " +
            "let canvases = canvasTarget.getElementsByTagName('canvas'); " +  // Remove duplicate canvases
            "canvases[canvases.length - 1].remove(); " +
            "canvases[0].remove(); " +
            "let svgs = canvasTarget.getElementsByClassName('colorMapLegend'); " +  // Remove all legends
            "for (let i = svgs.length - 1; i >= 0; i--) " +
                "svgs[i].remove(); " +
            "let dgs = canvasTarget.getElementsByClassName('dg'); " +  // Remove duplicate control panels
            "dgs[dgs.length - 1].remove(); " +
            "dgs[0].remove(); " +
            "let divs = canvasTarget.getElementsByTagName('div'); " +  // Remove duplicate grid labels in <div> 
            "divs[divs.length - 1].parentNode.remove(); " +
            "divs[0].remove(); " +
        "});";
}

/*
 * Get raw data from frame 2 (Pred Aug) to be drawn in the new frame
 */
function getRawDataFromFrame(iframeId) {
    let iframe = document.getElementById(iframeId);
    if (!iframe) {
      return "";
    }
    let scriptElement = iframe.contentWindow.document.getElementById("drawShapeScript_" + iframeId);
    console.log("scriptElement", scriptElement);
    if (!scriptElement) {
        scriptElement = iframe.contentWindow.document.body.getElementsByTagName("script")[0];
    }
    let scriptContent = scriptElement.innerHTML;
    let start = scriptContent.indexOf("var data ="); // Look for data starting point
    let end = scriptContent.indexOf("';", start); // Look for data ending point
    return scriptContent.substring(start + "var data =".length, end + 2);
}

/*
 * Create the new script by inserting the extra script into the existing one, remove the existing script, and return the new one
 * Extra script is inserted into the original script at: function(K3DInstance) { <extra script here> });
 */
function getNewScript(iframeId, frameColor1, frameOpacity1, frameColor2, frameOpacity2, backgroundColor, gridColor) {
    let iframe = document.getElementById(iframeId);
    if (!iframe) {
      return;
    }
    let injected = true; // Check if custom script has been injected previously
    let scriptElement = iframe.contentWindow.document.getElementById("mergeFramesScript_" + iframeId);
    if (!scriptElement) {
        injected = false;
        scriptElement = iframe.contentWindow.document.body.getElementsByTagName("script")[0];
    }
    let oldScript = scriptElement.innerHTML; // Current script, may be the original or our previously injected one
    scriptElement.parentNode.removeChild(scriptElement); // Remove existing script
    iframe.contentWindow.document.getElementById("canvasTarget").innerHTML = ""; // Remove everything inside canvasTarget div
    // Get first part to be placed before the insertion point
    let start = oldScript.indexOf("function(K3DInstance) {");
    let firstPart = oldScript.substring(0, start + "function(K3DInstance) {".length + 1);
    if (!injected)
        firstPart = "import * as THREE from 'three'; " + firstPart;
    // Get second part to be placed after the insertion point
    start = oldScript.indexOf("} catch (e) {");
    let secondPart = "}); " + oldScript.substring(start, oldScript.length);
    // Get new script: <first part> <frame2 data> <logic for merging> <second part>
    let newScript = firstPart + "var data1 =" + getRawDataFromFrame("title2")
        + getMergeFramesScript(frameColor1, frameOpacity1, frameColor2, frameOpacity2, backgroundColor, gridColor)
        + secondPart;
    return newScript;
}

function removeScriptFromIframe(iframe, jsId) {
    if (!iframe) {
      return;
    }
    let scriptToBeRemoved = iframe.contentWindow.document.getElementById(jsId);
    if (scriptToBeRemoved) {
        let sheetParent = scriptToBeRemoved.parentNode;
        if (sheetParent) {
            sheetParent.removeChild(scriptToBeRemoved);
        }
    }
}

// param "head": boolean to indicate if the script will be injected into <head> or <body>
function injectScriptIntoIframe(iframeId, jsId, jsType, jsText, head) {
    let iframe = document.getElementById(iframeId);
    if (!iframe) {
      return;
    }
    if (iframe.contentWindow.document.getElementById(jsId)) { // ID already exists
        if (head) {
          return; // <head> script will be injected once
        }
        else {
          removeScriptFromIframe(iframe, jsId); // <body> script will be replaced
        }
    }
    let script = iframe.contentWindow.document.createElement("script");
    script.id = jsId;
    script.type = jsType;
    script.innerHTML = jsText;
    if (head) {
      iframe.contentWindow.document.getElementsByTagName("head")[0].appendChild(script);
    }
    else {
      iframe.contentWindow.document.body.appendChild(script);
    }
}

/*
 * Color Picker
 */
const ColorPicker = (props) => {
    const [color, setColor] = React.useState(props.initColor);
    return (
      <input type="color" name={props.initName} value={color} 
        onChange={
            e => {
                setColor(e.target.value);
                props.onChange(e);
            }
        } />
    );
};

/*
 * Form for merging frames
 */
const FormMergeFrames = () => {
    const [formData, setFormData] = React.useState({
        frameColor1: "#00ff00", frameOpacity1: "0.9",
        frameColor2: "#ff0000", frameOpacity2: "0.9",
        backgroundColor: "#f6efef", gridColor: "#bbff00",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
    };

    const frameId = "mergeFrame";

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!window.confirm("This may take a long time to show the merged frames.")) {
          return;
        }

        // Uncheck "rotateChkBox" to be able to handle pointer events in the new frame
        let rotateChkBox = document.getElementById("rotateChkBox");
        if (rotateChkBox && rotateChkBox.checked) {
          rotateChkBox.click(); 
        }

        // Create a new iframe for showing merged frames, get content from frame1 source 
        let mergeFrame = document.getElementById(frameId);
        if (!mergeFrame) {
            const frameDiv = document.createElement("div");
            frameDiv.id = "mergeFrameDiv"
            frameDiv.classNme = "flex_child";
            frameDiv.style.textAlign = "center";
            const mergeFrameTitle = document.createElement("h3");
            mergeFrameTitle.innerHTML = "Merged Frames";
            frameDiv.appendChild(mergeFrameTitle);
            mergeFrame = document.createElement("iframe");
            mergeFrame.id = frameId;
            mergeFrame.title = "mergeFrame";
            mergeFrame.width = "800px";
            mergeFrame.height = "800px";
            mergeFrame.loading = "lazy";
            frameDiv.appendChild(mergeFrame);
            document.body.appendChild(frameDiv);
        }
        mergeFrame.src = document.getElementById("title1").src; // Load document from frame 1 (Ground Truth)
        // Start to inject scripts after the new frame has finished loading
        // Update new frame content by injecting a head script and a body script
        mergeFrame.addEventListener("load", function () {
            injectScriptIntoIframe(frameId, "threeJSheadScript_" + frameId,
                "importmap", threeJSheadScript, true); // true: insert script to <head>
            injectScriptIntoIframe(frameId, "mergeFramesScript_" + frameId, "module",
                getNewScript(frameId,
                    formData.frameColor1, formData.frameOpacity1,
                    formData.frameColor2, formData.frameOpacity2,
                    formData.backgroundColor, formData.gridColor), false); // false: insert script to <body>
        });
    };

    // When "Hide" button is clicked, remove the new frame, its title, and their parent div
    const handleClear = (event) => {
        event.preventDefault();
        if (!window.confirm("This will result in a loss of all manipulation.")) {
          return;
        }
        let frameDiv = document.getElementById("mergeFrameDiv");
        if (!frameDiv) {
          return;
        }
        frameDiv.remove();
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <label><b>Frame 1</b> (Color, Opacity): </label>
                <table><tbody><tr>
                    <td><ColorPicker initName="frameColor1" initColor="#00ff00" onChange={handleChange} /></td>
                    <td><input style={{ width: "4em" }} type="number" id="frameOpacity1" name="frameOpacity1"
                        value={formData.frameOpacity1} onChange={handleChange} min="0.0" max="1.0" step="0.01" /></td>
                </tr></tbody></table>
                <label><b>Frame 2</b> (Color, Opacity): </label>
                <table><tbody><tr>
                    <td><ColorPicker initName="frameColor2" initColor="#ff0000" onChange={handleChange} /></td>
                    <td><input style={{ width: "4em" }} type="number" id="frameOpacity2" name="frameOpacity2"
                        value={formData.frameOpacity2} onChange={handleChange} min="0.0" max="1.0" step="0.01" /></td>
                </tr></tbody></table>
                <label><b>Canvas and Grid Colors</b>: </label>
                <table><tbody><tr>
                    <td><ColorPicker initName="backgroundColor" initColor="#f6efef" onChange={handleChange} /></td>
                    <td><ColorPicker initName="gridColor" initColor="#bbff00" onChange={handleChange} /></td>
                </tr></tbody></table>

                <table><tbody><tr>
                    <td><button style={{ width: "4em" }} type="submit">Show</button></td>
                    <td><button style={{ width: "4em" }} type="button" onClick={handleClear}>Hide</button></td>
                </tr></tbody></table>
            </form>
        </>
    );
};

export default FormMergeFrames;
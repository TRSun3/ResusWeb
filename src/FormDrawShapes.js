/**
 * RoboTRAC Visualization Tool
 *
 * FormDrawShapes.js
 *
 * To use this component:
 * 1. Select shape to draw (Line, Sphere, Plane)
 * 2. Enter parameters
 * 3. Select frame(s) to draw one (1, 2, or both)
 * 4. Click "Draw" to draw, "Clear" to clear
 * 5. To drag and drop, hold Ctrl
 *    Note: drag and drop does not work when simultaneous rotation is enabled, consumed by rotating()
 */

// Imports
import "./FormDrawTabs.css";
import openTab from "./FormDrawTabs.js";
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
 * Script for drawing shapes
 */
function getDrawShapeScript(shape, x1, y1, z1, x2, y2, z2, color) {
  /*
   * Script for enabling drag and drop when Ctrl is held
   * Reference: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/DragControls.js
   * Modifications: Ctrl key status, if (!event.ctrlKey)
   * After new objects added, scene has 4+ children ["AmbientLight", "PerspectiveCamera", "Group", "Mesh" or "Line"]
   * Drag and drop only works for added objects
   */
  let part1 = `   
    const _plane = new Plane();
    const _raycaster = new Raycaster();
    const _pointer = new Vector2();
    const _offset = new Vector3();
    const _intersection = new Vector3();
    const _worldPosition = new Vector3();
    const _inverseMatrix = new Matrix4();
        
    class DragControls extends EventDispatcher {
        constructor( _objects, _camera, _domElement ) {
            super();
            _domElement.style.touchAction = 'none'; // Disable touch scroll
            let _selected = null, _hovered = null;
            const _intersections = [];
            const scope = this;
    
            function activate() {
                _domElement.addEventListener( 'pointermove', onPointerMove );
                _domElement.addEventListener( 'pointerdown', onPointerDown );
                _domElement.addEventListener( 'pointerup', onPointerCancel );
                _domElement.addEventListener( 'pointerleave', onPointerCancel );
            }
    
            function deactivate() {
                _domElement.removeEventListener( 'pointermove', onPointerMove );
                _domElement.removeEventListener( 'pointerdown', onPointerDown );
                _domElement.removeEventListener( 'pointerup', onPointerCancel );
                _domElement.removeEventListener( 'pointerleave', onPointerCancel );
                _domElement.style.cursor = '';
            }
    
            function dispose() {
                deactivate();
            }
    
            function getObjects() {
                return _objects;
            }
            
            function getRaycaster() {
                return _raycaster;
            }
    
            function onPointerMove( event ) {
                if ( scope.enabled === false ) return;
                if (!event.ctrlKey) return; 
                updatePointer( event );
                _raycaster.setFromCamera( _pointer, _camera );
                if ( _selected ) {
                    if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {
                        _selected.position.copy( _intersection.sub( _offset ).applyMatrix4( _inverseMatrix ) );
                    }
                    scope.dispatchEvent( { type: 'drag', object: _selected } );
                    return;
                }
    
                // Hover support
                if ( event.pointerType === 'mouse' || event.pointerType === 'pen' ) {
                    _intersections.length = 0;
                    _raycaster.setFromCamera( _pointer, _camera );
                    _raycaster.intersectObjects( _objects, true, _intersections );
                    if ( _intersections.length > 0 ) {
                        const object = _intersections[ 0 ].object;
                        _plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( object.matrixWorld ) );
                        if ( _hovered !== object && _hovered !== null ) {
                            scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );
                            _domElement.style.cursor = 'auto';
                            _hovered = null;
                        }
                        if ( _hovered !== object ) {
                            scope.dispatchEvent( { type: 'hoveron', object: object } );
                            _domElement.style.cursor = 'pointer';
                            _hovered = object;
                        }
                    } else {
                        if ( _hovered !== null ) {
                            scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );
                            _domElement.style.cursor = 'auto';
                            _hovered = null;
                        }
                    }
                }
            }
    
            function onPointerDown( event ) {
                if ( scope.enabled === false ) return;
                if (!event.ctrlKey) return;
                updatePointer( event );
                _intersections.length = 0;
                _raycaster.setFromCamera( _pointer, _camera );
                _raycaster.intersectObjects( _objects, true, _intersections );
                if ( _intersections.length > 0 ) {
                    _selected = ( scope.transformGroup === true ) ? _objects[ 0 ] : _intersections[ 0 ].object;
                    _plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( _selected.matrixWorld ) );
                    if ( _raycaster.ray.intersectPlane( _plane, _intersection ) && _selected && _selected.parent) {
                        _inverseMatrix.copy( _selected.parent.matrixWorld ).invert();
                        _offset.copy( _intersection ).sub( _worldPosition.setFromMatrixPosition( _selected.matrixWorld ) );
                    }
                    _domElement.style.cursor = 'move';
                    scope.dispatchEvent( { type: 'dragstart', object: _selected } );
                }
            }
    
            function onPointerCancel() {
                if ( scope.enabled === false ) return;
                if (!event.ctrlKey) return;
                if ( _selected ) {
                    scope.dispatchEvent( { type: 'dragend', object: _selected } );
                    _selected = null;
                }
                _domElement.style.cursor = _hovered ? 'pointer' : 'auto';
            }
    
            function updatePointer( event ) {
                const rect = _domElement.getBoundingClientRect();
                _pointer.x = ( event.clientX - rect.left ) / rect.width * 2 - 1;
                _pointer.y = - ( event.clientY - rect.top ) / rect.height * 2 + 1;
            }
    
            activate();
            // API
            this.enabled = true;
            this.transformGroup = false;
            this.activate = activate;
            this.deactivate = deactivate;
            this.dispose = dispose;
            this.getObjects = getObjects;
            this.getRaycaster = getRaycaster;
        }                      
    }`;
  /*
   * Script for drawing shapes
   * Reference, Line: https://threejs.org/docs/index.html#manual/en/introduction/Drawing-lines
   * Reference, Sphere: https://threejs.org/docs/index.html#api/en/geometries/SphereGeometry
   * Reference, Plane: https://threejs.org/docs/#api/en/geometries/PlaneGeometry
   */
  let part2 = `
    const addNewLineMesh = (shape, x1, y1, z1, x2, y2, z2, color) => { 
        if (shape === 'Line') {
            // When drawing a line, it is from (x1, y1, z1) to (x2, y2, z2)
            const material = new THREE.LineBasicMaterial( { color: color } ); 
            const points = [];
            points.push( new THREE.Vector3(x1, y1, z1) );
            points.push( new THREE.Vector3(x2, y2, z2) );
            const geometry = new THREE.BufferGeometry().setFromPoints( points );
            const line = new THREE.Line( geometry, material );
            K3DInstance.getScene().add(line);
        } else if (shape === 'Sphere') {
            // When drawing a sphere, it is at (x1, y1, z1)
            // x2 is the radius, y2 is the segments (0-32), z2 is the opacity (0-100)
            const geometry1 = new THREE.SphereGeometry( x2, y2*2, y2 );
            const material1 = new THREE.MeshStandardMaterial( { color: color } ); 
            material1.transparent = true;
            material1.opacity = Number(z2/100);
            const sphere = new THREE.Mesh( geometry1, material1 ); 
            sphere.position.set( x1, y1, z1 )
            K3DInstance.getScene().add(sphere); 
        } else if (shape === 'Plane') {
            // When drawing a plane, it is from (x1, y1) to (x2, y2) at z1, z2 is the opacity (0-100)
            const geometry2 = new THREE.PlaneGeometry(Number(x2)-Number(x1), Number(y2)-Number(y1));
            const material2 = new THREE.MeshStandardMaterial( {color: color , side: THREE.DoubleSide} );
            material2.transparent = true;
            material2.opacity = Number(z2/100);
            const plane = new THREE.Mesh( geometry2, material2 );
            // Plane placed based on its center point
            plane.position.set(
                Math.floor((Number(x2)+Number(x1)) / 2), 
                Math.floor((Number(y2)+Number(y1)) / 2), 
                Number(z1)); 
            K3DInstance.getScene().add(plane); 
        }   
    };`;

  /*
   * Script for creating a button that holds parameters set by the user through the UI
   * Draw or Clear: parameters set as button values, button is clicked; handled in event listener
   */
  let part3 =
    `
    if (!document.getElementById("hiddenDrawShapeParams")) {
        let body = document.getElementsByTagName("body")[0];
        let hiddenDrawShapeParams = document.createElement("button");
        hiddenDrawShapeParams.type = "button";
        hiddenDrawShapeParams.display="none"; // Hidden
        hiddenDrawShapeParams.id = "hiddenDrawShapeParams";
        hiddenDrawShapeParams.name = "hiddenDrawShapeParams";
        hiddenDrawShapeParams.value = "` +
    shape +
    "," +
    x1 +
    "," +
    y1 +
    "," +
    z1 +
    "," +
    x2 +
    "," +
    y2 +
    "," +
    z2 +
    "," +
    color +
    `";
        hiddenDrawShapeParams.onclick = function(){
            // Param at 0 is the shape like 'Line', 'Sphere', 'Plane', param at 7 is the color or 'clear'
            const params = document.getElementById("hiddenDrawShapeParams").value.split(",");
            if (K3DInstance.getScene().children.length > 3) {
                // Remove new object, geometry.type: BufferGeometry for line, SphereGeometry for sphere, PlaneGeometry for plane
                for (let i = K3DInstance.getScene().children.length - 1; i >= 3; i--) {
                    let obj = K3DInstance.getScene().children[i];
                    if ((params[0] === 'Line' && obj.geometry.type === 'BufferGeometry') 
                        || (params[0] === 'Sphere' && obj.geometry.type === 'SphereGeometry')
                        || (params[0] === 'Plane' && obj.geometry.type === 'PlaneGeometry'))
                        K3DInstance.getScene().remove(K3DInstance.getScene().children[i]);                    
                }
            }
            if (!params[7].includes('clear')) { 
                addNewLineMesh(params[0], params[1],params[2],params[3],params[4],params[5],params[6],params[7]);
                // Enable drag & drop
                let DragControlsInstance;
                const _objects = []; 
                if (K3DInstance.getScene().children.length > 3) {
                    // Add all new objects
                    for (let i = 3; i < K3DInstance.getScene().children.length; i++) {
                        _objects.push(K3DInstance.getScene().children[i]);
                    }
                    const _camera = K3DInstance.getWorld().camera;
                    const _domElement = document.getElementById('canvasTarget');
                    DragControlsInstance = new DragControls(_objects, _camera, _domElement);
                }
            }
        };
        body.appendChild(hiddenDrawShapeParams);
        hiddenDrawShapeParams.click();
    }`;

  return part1 + part2 + part3;
}

/*
 * Create the new script by inserting the extra script into the existing one, remove the existing script, and return the new one
 * The extra script is inserted into the original script at: function(K3DInstance) { <extra script here> });
 */
function getNewScript(iframeId, shape, x1, y1, z1, x2, y2, z2, color) {
  let iframe = document.getElementById(iframeId);
  if (!iframe) {
    return;
  }
  let injected = true; // Should always be false
  let scriptElement = iframe.contentWindow.document.getElementById(
    "drawShapeScript_" + iframeId
  );
  if (!scriptElement) {
    scriptElement =
      iframe.contentWindow.document.body.getElementsByTagName("script")[0];
    injected = false;
  }
  let oldScript = scriptElement.innerHTML; // Current script, may be the original or the previously injected one
  let start = oldScript.indexOf("function(K3DInstance) {");
  let firstPart = oldScript.substring(
    0,
    start + "function(K3DInstance) {".length + 1
  );
  if (!injected) {
    firstPart =
      "import * as THREE from 'three'; " +
      "import { EventDispatcher, Matrix4, Plane, Raycaster, Vector2, Vector3 } from 'three'; " +
      firstPart;
  }
  start = oldScript.indexOf("} catch (e) {");
  let secondPart = "}); " + oldScript.substring(start, oldScript.length);
  let newScript =
    firstPart +
    getDrawShapeScript(shape, x1, y1, z1, x2, y2, z2, color) +
    secondPart;
  iframe.contentWindow.document.getElementById("canvasTarget").textContent = ""; // Remove everything inside canvasTarget div
  scriptElement.remove(); // Remove the existing script
  return newScript;
}

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

// param "head": boolean to indicate if the script will be injected to <head> or <body>
function injectScriptIntoIframe(iframeId, jsId, jsType, jsText, head) {
  let iframe = document.getElementById(iframeId);
  if (!iframe) {
    return;
  }
  if (iframe.contentWindow.document.getElementById(jsId)) {
    if (head) {
      // ID already exists
      return; // <head> script will be injected once
    } else {
      removeScriptFromIframe(iframe, jsId); // <body> script will be replaced (should not happen)
    }
  }
  let script = iframe.contentWindow.document.createElement("script");
  script.id = jsId;
  script.type = jsType;
  script.innerHTML = jsText;
  if (head) {
    iframe.contentWindow.document
      .getElementsByTagName("head")[0]
      .appendChild(script);
  } else {
    iframe.contentWindow.document.body.appendChild(script);
  }
}

/*
 * Get max and current sliced ultrasound image frame numbers from the slider
 * The slider is an "input" element with name "index" and type "range"
 */
function getMaxCurrentFrameNumbers() {
  let inputs = document.getElementsByTagName("input");
  for (let i = 0; i < inputs.length; i++)
    if (
      inputs[i].name &&
      inputs[i].name === "index" &&
      inputs[i].type &&
      inputs[i].type === "range" &&
      inputs[i].max &&
      inputs[i].value
    ) {
      return [inputs[i].max, inputs[i].max - inputs[i].value];
    }
  return ["-1", "-1"]; // Slider not loaded yet
}

/*
 * Get max y, x, z grid coordinates from Ground Truth (min values are all 0, increment is usually 100)
 * Coordinate tag is "mn"; the order is y, x, z, each has four sets for the four edges of a box
 * For example, if max y, x, z are 200, 300, 500, then there will be four sets of "mn" as (0, 100, 200),
 * another four sets of "mn" as (0, 100, 200, 300), and finally four sets of "mn" as (0, 100, 200, 300, 400, 500)
 */
function getMaxGridCoordinates() {
  let canvasTarget = document
    .getElementById("title1")
    .contentWindow.document.getElementById("canvasTarget");
  let mnElements = canvasTarget.getElementsByTagName("mn");
  let maxYXZ = [-100],
    yxz = 0;
  for (const mn of mnElements) {
    if (Number(mn.innerHTML) < maxYXZ[yxz]) {
      yxz++;
    }
    maxYXZ[yxz] = Number(mn.innerHTML);
  }
  // maxYXZ is for example something like [200, 200, 200, 200, 300, 300, 300, 300, 500, 500, 500, 500]
  // Indices 0-3 are for max y, 4-7 are for max x, 8-11 are for max z
  return [maxYXZ[0], maxYXZ[4], maxYXZ[8]];
}

const iframeIds = ["title1", "title2"];

/*
 * Draw shapes
 */
const FormDrawShapes = () => {
  const [formData, setFormData] = React.useState({
    // Line, from (x1, y1, z1) to (x2, y2, z2)
    x1: "300",
    y1: "300",
    z1: "300",
    x2: "100",
    y2: "100",
    z2: "300",
    lineColor: "#00ff00",
    // Sphere, centered at (x3, y3, z3)
    x3: "200",
    y3: "200",
    z3: "200",
    x4: "20", // Radius
    y4: "32", // Segments
    z4: "100", // Opacity
    sphereColor: "#ff0000",
    // Plane, from (x5, y5) to (x6, y6) at z5
    x5: "0",
    y5: "0",
    z5: "300",
    x6: "200",
    y6: "200",
    z6: "100", // Opacity
    planeColor: "#0000ff",
  });
  const [selectedOption, setSelectedOption] = React.useState("both");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleDropdownChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleSubmit = (event, shape) => {
    event.preventDefault();
    if (
      !window.confirm(
        "This may result in a loss of all manipulation and may take a while to reload for the first use."
      )
    ) {
      return;
    }

    // Parameters to send, default for Line
    let p1 = formData.x1,
      p2 = formData.y1,
      p3 = formData.z1;
    let p4 = formData.x2,
      p5 = formData.y2,
      p6 = formData.z2,
      p7 = formData.lineColor;
    if (shape === "Sphere") {
      p1 = formData.x3;
      p2 = formData.y3;
      p3 = formData.z3;
      p4 = formData.x4;
      p5 = formData.y4;
      p6 = formData.z4;
      p7 = formData.sphereColor;
    } else if (shape === "Plane") {
      // Use grid coordinates and slider index to configure the position
      let maxYXZ = getMaxGridCoordinates(); // 0: max y, 1: max x, 2: max z
      p1 = -100;
      p2 = -100;
      p4 = Math.floor(maxYXZ[1]) + 100;
      p5 = Math.floor(maxYXZ[0]) + 100;
      let numbers = getMaxCurrentFrameNumbers(); // 0: max, 1: current
      p3 = Math.floor((maxYXZ[2] * numbers[1]) / numbers[0]); // Get slice at z
      p6 = formData.z6;
      p7 = formData.planeColor;
      setFormData((prevFormData) => ({
        ...prevFormData,
        z5: p3,
        x6: p4,
        y6: p5,
      }));
      formData.z5 = p3;
      formData.x6 = p4;
      formData.y6 = p5;
      document.getElementById("planeInfo").innerHTML =
        "Drawn at Z: " + p3 + " (Index: " + numbers[1] + ")";
    }

    if (selectedOption === "both") {
      for (let i = 0; i < iframeIds.length; i++) {
        let iframe = document.getElementById(iframeIds[i]);
        if (!iframe) {
          continue;
        }
        // Script already injected, change parameter values with a button and click it to draw
        if (
          iframe.contentWindow.document.getElementById(
            "drawShapeScript_" + iframeIds[i]
          )
        ) {
          let hiddenParams = iframe.contentWindow.document.getElementById(
            "hiddenDrawShapeParams"
          );
          hiddenParams.value =
            shape +
            "," +
            p1 +
            "," +
            p2 +
            "," +
            p3 +
            "," +
            p4 +
            "," +
            p5 +
            "," +
            p6 +
            "," +
            p7;
          hiddenParams.click();
          continue;
        }

        // Script not injected yet, inject both head script and body script
        document.getElementById("btnResetCamera").click();
        injectScriptIntoIframe(
          iframeIds[i],
          "threeJSheadScript_" + iframeIds[i],
          "importmap",
          threeJSheadScript,
          true
        ); // true: insert script to <head>
        injectScriptIntoIframe(
          iframeIds[i],
          "drawShapeScript_" + iframeIds[i],
          "module",
          getNewScript(iframeIds[i], shape, p1, p2, p3, p4, p5, p6, p7),
          false
        ); // false: insert script to <body>
      }
    } else {
      // One frame is chosen
      let iframe = document.getElementById(selectedOption);
      if (!iframe) {
        return;
      }
      // Script already injected, change parameter values with a button and click it to draw
      if (
        iframe.contentWindow.document.getElementById(
          "drawShapeScript_" + selectedOption
        )
      ) {
        let hiddenParams = iframe.contentWindow.document.getElementById(
          "hiddenDrawShapeParams"
        );
        hiddenParams.value =
          shape +
          "," +
          p1 +
          "," +
          p2 +
          "," +
          p3 +
          "," +
          p4 +
          "," +
          p5 +
          "," +
          p6 +
          "," +
          p7;
        hiddenParams.click();
        return;
      }

      // Script not injected yet, inject both head script and body script
      injectScriptIntoIframe(
        selectedOption,
        "threeJSheadScript_" + selectedOption,
        "importmap",
        threeJSheadScript,
        true
      ); // true: insert script to <head>
      injectScriptIntoIframe(
        selectedOption,
        "drawShapeScript_" + selectedOption,
        "module",
        getNewScript(selectedOption, shape, p1, p2, p3, p4, p5, p6, p7),
        false
      ); // false: insert script to <body>
    }

    document.getElementById("btnResetCamera").click();
  };

  const handleClear = (event, shape) => {
    event.preventDefault();
    if (
      !window.confirm(
        "This may result in a loss of all manipulation and may take a while to reload."
      )
    ) {
      return;
    }

    document.getElementById("planeInfo").innerHTML = "Drawn at Z: ";
    if (selectedOption === "both") {
      for (let i = 0; i < iframeIds.length; i++) {
        let iframe = document.getElementById(iframeIds[i]);
        if (!iframe) {
          continue;
        }
        if (
          iframe.contentWindow.document.getElementById(
            "drawShapeScript_" + iframeIds[i]
          )
        ) {
          // Script exists, injected
          let hiddenParams = iframe.contentWindow.document.getElementById(
            "hiddenDrawShapeParams"
          );
          hiddenParams.value = shape + ",0,0,0,0,0,0,clear"; // Clear
          hiddenParams.click();
        }
      }
    } else {
      // One frame is chosen
      let iframe = document.getElementById(selectedOption);
      if (!iframe) {
        return;
      }
      if (
        iframe.contentWindow.document.getElementById(
          "drawShapeScript_" + selectedOption
        )
      ) {
        // Script exists, injected
        let hiddenParams = iframe.contentWindow.document.getElementById(
          "hiddenDrawShapeParams"
        );
        hiddenParams.value = shape + ",0,0,0,0,0,0,clear"; // Clear
        hiddenParams.click();
      }
    }
  };

  return (
    <>
      <div className="tab">
        <button className="tablinks" onClick={(e) => openTab(e, "Line")}>
          Line
        </button>
        <button className="tablinks" onClick={(e) => openTab(e, "Sphere")}>
          Sphere
        </button>
        <button className="tablinks" onClick={(e) => openTab(e, "Plane")}>
          Plane
        </button>
      </div>
      <form>
        <div id="Line" className="tabcontent">
          <br />
          <label>
            <b>From</b> (x1, y1, z1):{" "}
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="x1"
                    name="x1"
                    value={formData.x1}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="y1"
                    name="y1"
                    value={formData.y1}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="z1"
                    name="z1"
                    value={formData.z1}
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>To</b> (x2, y2, z2):
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="x2"
                    name="x2"
                    value={formData.x2}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="y2"
                    name="y2"
                    value={formData.y2}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="z2"
                    name="z2"
                    value={formData.z2}
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>Line Color</b>:
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <ColorPicker
                    initName="lineColor"
                    initColor="#00ff00"
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>On Frames</b> (1/2):
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <select
                    style={{ width: "4em" }}
                    value={selectedOption}
                    onChange={handleDropdownChange}
                  >
                    <option value="both">Both</option>
                    <option value="title1">On 1</option>
                    <option value="title2">On 2</option>
                  </select>
                </td>
                <td>
                  <button
                    style={{ width: "4em" }}
                    type="button"
                    onClick={(e) => handleSubmit(e, "Line")}
                  >
                    Draw
                  </button>
                </td>
                <td>
                  <button
                    style={{ width: "4em" }}
                    type="button"
                    onClick={(e) => handleClear(e, "Line")}
                  >
                    Clear
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="Sphere" className="tabcontent">
          <br />
          <label>
            <b>Position</b> (x, y, z):{" "}
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="x3"
                    name="x3"
                    value={formData.x3}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="y3"
                    name="y3"
                    value={formData.y3}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="z3"
                    name="z3"
                    value={formData.z3}
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>As</b> (radius, segmts, opacity):
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="x4"
                    name="x4"
                    min="0"
                    value={formData.x4}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="y4"
                    name="y4"
                    max="32"
                    min="1"
                    value={formData.y4}
                    onChange={handleChange}
                  />
                </td>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="z4"
                    name="z4"
                    max="100"
                    min="0"
                    value={formData.z4}
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>Sphere Color</b>:
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <ColorPicker
                    initName="sphereColor"
                    initColor="#ff0000"
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>On Frames</b> (1/2):
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <select
                    style={{ width: "4em" }}
                    value={selectedOption}
                    onChange={handleDropdownChange}
                  >
                    <option value="both">Both</option>
                    <option value="title1">On 1</option>
                    <option value="title2">On 2</option>
                  </select>
                </td>
                <td>
                  <button
                    style={{ width: "4em" }}
                    type="button"
                    onClick={(e) => handleSubmit(e, "Sphere")}
                  >
                    Draw
                  </button>
                </td>
                <td>
                  <button
                    style={{ width: "4em" }}
                    type="button"
                    onClick={(e) => handleClear(e, "Sphere")}
                  >
                    Clear
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="Plane" className="tabcontent">
          <br />
          <label>
            <b>Tip: Slide the Slider to Slice</b>
          </label>
          <br />
          <br />
          <label>
            <b id="planeInfo">Drawn at Z: </b>
          </label>
          <hr />
          <label>
            <b>Plane Opacity</b>:
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <input
                    style={{ width: "4em" }}
                    type="number"
                    id="z6"
                    name="z6"
                    max="100"
                    min="0"
                    value={formData.z6}
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>Plane Color</b>:
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <ColorPicker
                    initName="planeColor"
                    initColor="#0000ff"
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <label>
            <b>On Frames</b> (1/2):
          </label>
          <table>
            <tbody>
              <tr>
                <td>
                  <select
                    style={{ width: "4em" }}
                    value={selectedOption}
                    onChange={handleDropdownChange}
                  >
                    <option value="both">Both</option>
                    <option value="title1">On 1</option>
                    <option value="title2">On 2</option>
                  </select>
                </td>
                <td>
                  <button
                    style={{ width: "4em" }}
                    type="button"
                    onClick={(e) => handleSubmit(e, "Plane")}
                  >
                    Draw
                  </button>
                </td>
                <td>
                  <button
                    style={{ width: "4em" }}
                    type="button"
                    onClick={(e) => handleClear(e, "Plane")}
                  >
                    Clear
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </>
  );
};

/*
 * Color Picker
 */
const ColorPicker = (props) => {
  const [color, setColor] = React.useState(props.initColor);
  return (
    <input
      type="color"
      name={props.initName}
      value={color}
      onChange={(e) => {
        setColor(e.target.value);
        props.onChange(e);
      }}
    />
  );
};

export default FormDrawShapes;

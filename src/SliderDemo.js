/**
 * RoboTRAC Visualization Tool
 *
 * SliderDemo.js
 */

// Imports
import React, { Component } from "react";
import { Form, Grid, Menu, Image, Button, Checkbox } from "semantic-ui-react";
import { open } from "rosbag";
import Plot from "react-plotly.js";
import ReactDOM from "react-dom/client";
import BackgroundColor from "./BackgroundColor";
import { ChkShowTopArrow, injectShowTopArrowScript } from "./ChkShowTopArrow";
import AccordionMenu from "./AccordionMenu";

// List of PIG files
const pigs = [
  "2020-09-24--21-21-07_stacked",
  "2020-10-13--21-09-50_vol1",
  "2020-10-13--21-09-50_vol2",
  "2020-10-20--21-13-12_stacked",
  "2021-03-18--20-28-33_stacked",
  "2021-05-04--20-56-25_vol2",
  "phantom-5-2",
  "2022-09-20--20-24-20",
  "2022-10-06--20-13-38",
  "2022-11-10--21-20-31",
  "2022-11-10--21-25-57",
  "2023-01-19--22-49-09",
  "2023-02-09--21-11-23",
  "new",
];

// PIG options
const options = pigs.map((p) => ({
  key: p,
  text: `Pig ${p}`,
  value: p,
}));

export default class SliderDemo extends Component {
  state = { pig: pigs[0], index: 1 };
  iframeIds = ["title1", "title2"];

  componentDidMount() {
    for (let i = 0; i < this.iframeIds.length; i++)
      document
        .getElementById(this.iframeIds[i])
        .addEventListener("load", injectShowTopArrowScript);
  }
  handleChange = (_e, { name, value }) => this.setState({ [name]: value });

  async draw(file) {
    const bag = await open(file);
    var best_marker_points = new Array(Number);
    var most_points = -1;
    var best_color = new Array(Number);
    await bag.readMessages(
      { topics: ["/ultrasound_reconstruction"] },
      (result) => {
        var points = [];
        var colors = [];
        var angles = [];
        for (var i = 0; i < result.message.markers.length; i++) {
          var color = Math.random();
          for (var j = 0; j < result.message.markers[i].points.length; j++) {
            points.push(result.message.markers[i].points[j]);
            colors.push(color);
            angles.push();
          }
          if (points.length > most_points) {
            best_marker_points = points;
            most_points = points.length;
            best_color = colors;
          }
        }
      }
    );

    var x = [];
    var y = [];
    var z = [];
    for (var i = 0; i < best_marker_points.length; i++) {
      x.push(best_marker_points[i].x);
      y.push(best_marker_points[i].y);
      z.push(best_marker_points[i].z);
    }

    var a = [];
    var b = [];
    var c = [];
    for (i = 0; i < best_marker_points.length; i++) {
      if (i % 3 === 0) {
        a.push(i);
      } else if (i % 3 === 1) {
        b.push(i);
      } else {
        c.push(i);
      }
    }

    var graph = (
      <Plot
        data={[
          {
            type: "mesh3d",
            x: x,
            y: y,
            z: z,
            opacity: 1,
            alphahull: 5,
            i: a,
            j: b,
            k: c,
            intensity: best_color,
            color: "cyan",
          },
        ]}
        layout={{ width: 500, height: 500, title: "Model" }}
      />
    );
    const graphPlace = ReactDOM.createRoot(document.getElementById("graphDiv"));
    graphPlace.render(graph);
  }

  /*
   * Folds the two K3D panels when status is true
   * Expands the two K3D panels when status is false
   */
  foldPanels = (status) => {
    for (let i = 0; i < this.iframeIds.length; i++) {
      let iframe = document.getElementById(this.iframeIds[i]);
      if (!iframe) {
        continue;
      }
      let titleNode =
        iframe.contentWindow.document.getElementsByClassName("title");
      if (!titleNode) {
        continue;
      }
      // Buttons
      for (let b = 0; b < titleNode.length; b++) {
        if (
          titleNode[b] &&
          titleNode[b].role &&
          titleNode[b].role.toLowerCase() === "button"
        ) {
          if (
            titleNode[b].getAttribute("aria-expanded").toLowerCase() === status
          ) {
            titleNode[b].click();
          }
        }
      }
    }
  };

  /*
   * Event listener for detaching widget to a separate window
   */
  detach = (event) => {
    if (event.detail !== 2) {
      return;
    }
    let eventTarget = event.target.lastChild;
    if (
      !eventTarget ||
      !eventTarget.tagName ||
      eventTarget.tagName.toLowerCase() !== "iframe" ||
      !eventTarget.id ||
      this.iframeIds.indexOf(eventTarget.id.toLowerCase()) === -1
    ) {
      return;
    }
    let buttons =
      eventTarget.contentWindow.document.getElementsByClassName("name");
    for (let b = 0; b < buttons.length; b++) {
      if (buttons[b].textContent.toLowerCase() === "detach widget") {
        buttons[b].click();
      }
    }
  };

  /*
   * Reloads the iframe
   */
  reloadFrames = (iframeId) => {
    let iframe = document.getElementById(iframeId);
    if (iframe) {
      iframe.contentWindow.location.reload();
    }
  };

  /*
   * Resets the camera for a frame
   */
  resetCamera = (iframeId) => {
    let iframe = document.getElementById(iframeId);
    if (!iframe) {
      return;
    }
    let buttons = iframe.contentWindow.document.getElementsByClassName("name");
    for (let b = 0; b < buttons.length; b++) {
      if (buttons[b].textContent.toLowerCase() === "reset camera") {
        buttons[b].click();
      }
    }
  };

  /*
   * Event listener for pointer events
   */
  rotate = (event, eventType) => {
    if (!document.getElementById("rotateChkBox").checked) {
      return;
    }
    let eventTarget = event.target.lastChild;
    if (
      !eventTarget ||
      !eventTarget.tagName ||
      eventTarget.tagName.toLowerCase() !== "iframe" ||
      !eventTarget.id ||
      this.iframeIds.indexOf(eventTarget.id.toLowerCase()) === -1
    ) {
      return;
    }
    this.foldPanels("true");
    for (let i = 0; i < this.iframeIds.length; i++) {
      let iframe = document.getElementById(this.iframeIds[i]);
      if (!iframe) {
        continue;
      }
      let canvas = iframe.contentWindow.document.getElementsByTagName("canvas");
      if (!canvas) {
        continue;
      }
      for (let c = 0; c < canvas.length; c++) {
        if (canvas[c].id === "myCanvas") {
          let newEvent = new event.nativeEvent.constructor(
            event.nativeEvent.type,
            event.nativeEvent
          );
          canvas[c].dispatchEvent(newEvent);
        }
      }
    }
  };

  /*
   * Rendering the visualization tool
   */
  render() {
    const { pig, index } = this.state;
    if (pig.localeCompare(pigs[13]) !== 0) {
      const pig_path = `${process.env.PUBLIC_URL}/data/newImages/${pig}`;
      const perf1 = `${pig_path}/gt.html`;
      const perf2 = `${pig_path}/pred_aug.html`;
      const perf3 = `${pig_path}/experiment.html`;
      var maxIndexValues = [84, 68, 68, 69, 85, 55, 73, 50];
      var maxIndex = 0;
      var hasGT = false; // Ground Truth
      var pigsHasGT = 6;
      for (let i = 0; i <= pigsHasGT; i++) {
        if (pig.localeCompare(pigs[i]) === 0) {
          maxIndex = maxIndexValues[i];
          hasGT = true;
        }
      }
      if (maxIndex === 0) {
        maxIndex = 50;
      }
      if (hasGT) {
        return (
          <div
            onPointerCancel={(e) => this.rotate(e, 1)}
            onPointerDown={(e) => this.rotate(e, 2)}
            onPointerMove={(e) => this.rotate(e, 3)}
            onPointerUp={(e) => this.rotate(e, 4)}
            onWheel={(e) => this.rotate(e, 5)}
            onClick={(e) => this.detach(e)}
          >
            <Grid centered>
              <Grid.Row columns={2}>
                <Grid.Column>
                  <div id="flex_container">
                    <Menu vertical style={{ backgroundColor: "lightblue" }}>
                      <Menu.Item>
                        <div className="flex_child">
                          <h4 style={{ color: "green" }}>
                            Select a Pig Ultrasound Reconstruction:
                          </h4>
                          <Form.Dropdown
                            style={{ color: "blue" }}
                            name="pig"
                            onChange={this.handleChange}
                            options={options}
                            value={pig}
                          />
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="flex_child">
                          <Button
                            primary
                            onClick={(event) => {
                              for (let i = 0; i < this.iframeIds.length; i++) {
                                this.reloadFrames(this.iframeIds[i]);
                              }
                              this.foldPanels("true");
                            }}
                          >
                            Reload Frames
                          </Button>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="flex_child">
                          <Button
                            id="btnResetCamera"
                            primary
                            onClick={(event) => {
                              for (let i = 0; i < this.iframeIds.length; i++) {
                                this.resetCamera(this.iframeIds[i]);
                              }
                              this.foldPanels("true");
                            }}
                          >
                            Reset Cameras
                          </Button>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="flex_child">
                          <p style={{ color: "green" }}>Simultaneous Frames</p>
                          <Checkbox
                            toggle
                            id="rotateChkBox"
                            onChange={(e, data) => {
                              // Both iframes
                              for (let i = 0; i < this.iframeIds.length; i++) {
                                let iframe = document.getElementById(
                                  this.iframeIds[i]
                                );
                                if (!iframe) {
                                  data.checked = false;
                                  return;
                                }
                              }
                              if (data.checked) {
                                this.foldPanels("true");
                                // Turn off iframe pointer events by inserting tempStyle
                                let sheet = document.createElement("style");
                                sheet.setAttribute("id", "tempStyle");
                                sheet.innerHTML =
                                  "iframe {overflow: hidden; pointer-events: none;}";
                                document.body.appendChild(sheet);
                              } else {
                                // Remove tempStyle
                                let sheetToBeRemoved =
                                  document.getElementById("tempStyle");
                                while (sheetToBeRemoved) {
                                  let sheetParent = sheetToBeRemoved.parentNode;
                                  if (sheetParent) {
                                    sheetParent.removeChild(sheetToBeRemoved);
                                  }
                                  sheetToBeRemoved =
                                    document.getElementById("tempStyle");
                                }
                              }
                            }}
                          />
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <BackgroundColor />
                      </Menu.Item>
                      <Menu.Item>
                        <ChkShowTopArrow />
                      </Menu.Item>
                    </Menu>
                    <Menu.Item style={{ textAlign: "left" }}>
                      <AccordionMenu />
                    </Menu.Item>
                  </div>
                </Grid.Column>
                <Grid.Column>
                  <p>Sliced ultrasound image from reconstructed volume</p>
                  <Image src={`${pig_path}/frames/${index}.png`} />
                  <div>
                    <Form.Input
                      min={1}
                      max={maxIndex}
                      name="index"
                      onChange={this.handleChange}
                      step={1}
                      type="range"
                      value={index}
                    />
                  </div>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row columns={1}>
                <div id="flex_container">
                  <div className="flex_child">
                    <h3>Ground Truth</h3>
                    <iframe
                      id="title1"
                      title="title1"
                      src={perf1}
                      width="500px"
                      height="500px"
                      loading="lazy"
                    ></iframe>
                  </div>
                  <div className="flex_child">
                    <h3>Pred Aug</h3>
                    <iframe
                      id="title2"
                      title="title2"
                      src={perf2}
                      width="500px"
                      height="500px"
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>
              </Grid.Row>
            </Grid>
          </div>
        );
      }
      return (
        <Grid centered columns={2}>
          <Grid.Column textAlign="center" as={Form}>
            <Image src={`${pig_path}/frames/${index}.png`} centered />
            <p>Sliced ultrasound image from reconstructed volume</p>
            <Form.Input
              min={1}
              max={maxIndex}
              name="index"
              onChange={this.handleChange}
              step={1}
              type="range"
              value={index}
            />
            <br />
            <br />
            <br />
            <br />
            <Form.Dropdown
              label="Select a pig ultrasound reconstruction:"
              name="pig"
              onChange={this.handleChange}
              options={options}
              value={pig}
            />
          </Grid.Column>
          <Grid.Column textAlign="center">
            <h3>Pred Aug</h3>
            <iframe
              id="title3"
              title="title3"
              src={perf3}
              width="500px"
              height="500px"
              loading="lazy"
            ></iframe>
          </Grid.Column>
        </Grid>
      );
    } else {
      return (
        <Grid centered columns={1}>
          <Grid.Column textAlign="center">
            <form className="processFile">
              {/* onSubmit={this.draw} */}
              <label>
                ROSbag File:
                <br />
                <br />
                <input
                  type="file"
                  accept=".bag"
                  id="inputFile"
                  onChange={(e) => this.draw(e.target.files[0])}
                />
              </label>
            </form>
            <div id="graphDiv"></div>
            <Form.Dropdown
              label="Select a pig ultrasound reconstruction:"
              name="pig"
              onChange={this.handleChange}
              options={options}
              value={pig}
            />
          </Grid.Column>
        </Grid>
      );
    }
  }
}

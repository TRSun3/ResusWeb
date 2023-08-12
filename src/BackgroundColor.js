/**
 * Visualization Tool for RoboTRAC
 *
 * BackgroundColor.js
 *
 * Background Color Picker
 * Reference: https://www.npmjs.com/package/react-color
 */

// Imports
import { SketchPicker } from "react-color";
import React from "react";
import reactCSS from "reactcss";

const iframeIds = ["title1", "title2"];

/*
 * Background Color Picker
 *
 * Reference: https://casesandberg.github.io/react-color/
 */
class BackgroundColor extends React.Component {
  state = {
    displayColorPicker: false,
    color: {
      r: "255",
      g: "255",
      b: "255",
      a: "1",
    },
  };

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  handleChange = (color) => {
    this.setState({ color: color.rgb });
    for (let i = 0; i < iframeIds.length; i++) {
      let iframe = document.getElementById(iframeIds[i]);
      if (iframe) {
        let canvasTarget =
          iframe.contentWindow.document.getElementById("canvasTarget");
        canvasTarget.setAttribute(
          "style",
          "cursor: auto; " +
            "background-color: rgba(" +
            this.state.color.r +
            ", " +
            this.state.color.g +
            ", " +
            this.state.color.b +
            ", " +
            this.state.color.a +
            ")"
        );
      }
    }
  };

  render() {
    const styles = reactCSS({
      default: {
        color: {
          width: "100px",
          height: "15px",
          borderRadius: "2px",
          background: `rgba(${this.state.color.r}, ${this.state.color.g}, ${this.state.color.b}, ${this.state.color.a})`,
        },
        swatch: {
          padding: "5px",
          background: "#6C9DCE",
          borderRadius: "1px",
          boxShadow: "110 120 130 2px rgba(110,120,130,.3)",
          display: "inline-block",
          cursor: "pointer",
        },
        popover: {
          position: "absolute",
          zIndex: "2",
        },
        cover: {
          position: "fixed",
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
        },
      },
    });

    return (
      <div>
        <p>Background Color</p>
        <div style={styles.swatch} onClick={this.handleClick}>
          <div style={styles.color} />
        </div>
        {this.state.displayColorPicker ? (
          <div style={styles.popover}>
            <div style={styles.cover} onClick={this.handleClose} />
            <SketchPicker
              color={this.state.color}
              onChange={this.handleChange}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

export default BackgroundColor;

import React from "react";
import {Header} from "semantic-ui-react";

export default class Navbar extends React.Component {
  state = { activeItem: "home" };

  handleItemClick = (
    e,
    { name }
  ) => {
    this.setState({ activeItem: name });
  };
  render() {
    return <div><Header as="h1" textAlign="center">3D Visualization Tool for Robot-Guided Needle Insertion</Header><br /><br /></div>;
  }
}

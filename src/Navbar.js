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
    return <Header as="h1">RESUS Demo</Header>;
  }
}

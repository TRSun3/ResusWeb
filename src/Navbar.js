import React, { ChangeEvent } from "react";
import { Menu, Header, InputOnChangeData } from "semantic-ui-react";

export default class Navbar extends React.Component {
  state = { activeItem: "home" };

  handleItemClick = (
    e,
    { name }
  ) => {
    this.setState({ activeItem: name });
  };

  render() {
    const { activeItem } = this.state;

    return <Header as="h1">RESUS Demo</Header>;
  }
}

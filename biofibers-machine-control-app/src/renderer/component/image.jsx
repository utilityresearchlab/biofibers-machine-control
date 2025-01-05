import React from "react";

import logoImg from "../../assets/img/utility-research-web-logo-500x75.png";

class Image extends React.Component {
  render() {
    return (
      <React.Fragment>
        <img src={logoImg} />
        
      </React.Fragment>
    );
  }
}

export default Image;
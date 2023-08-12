/**
 * RoboTRAC Visualization Tool
 *
 * AccordionMenu.js
 *
 * Accordion Menu that expands and collapses when clicked
 * Currently contains Merge Frames and Draw Needle Annotation
 */

// Imports
import * as React from "react";
import FormMergeFrames from "./FormMergeFrames";
import FormDrawShapes from "./FormDrawShapes";

/*
 * Accordion Menu that expands and collapses when clicked
 *
 * Reference: https://www.freecodecamp.org/news/build-accordion-menu-in-react-without-external-libraries/
 */
const Accordion = ({ title, content }) => {
  const [isActive, setIsActive] = React.useState(false);

  return (
    <div className="accordion-item">
      <div className="accordion-title" onClick={() => setIsActive(!isActive)}>
        <h4 style={{ color: "green" }}>
          {title} {isActive ? "-" : "+"}
        </h4>
      </div>
      {isActive && <div className="accordion-content">{content}</div>}
      <hr />
    </div>
  );
};

/*
 * Accordion Menu Titles and Content
 */
const AccordionMenu = () => {
  const accordionData = [
    {
      title: "Merge Frames",
      content: FormMergeFrames(),
    },
    {
      title: "Draw Needle Annotation",
      content: FormDrawShapes(),
    },
  ];

  return (
    <div>
      <div className="accordion">
        {accordionData.map(({ title, content }) => (
          <Accordion key={title} title={title} content={content} />
        ))}
      </div>
    </div>
  );
};

export default AccordionMenu;

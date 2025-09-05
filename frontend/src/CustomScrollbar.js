// src/CustomScrollbar.js
import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const CustomScrollbar = ({ children, className, style, ...props }) => {
  return (
    <SimpleBar
      className={className}
      style={style}
      autoHide={false} // Mudado para false para sempre mostrar a scrollbar
      {...props}
    >
      {children}
    </SimpleBar>
  );
};

export default CustomScrollbar;

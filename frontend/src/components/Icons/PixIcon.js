// src/components/Icons/PixIcon.js

import React from 'react';

const PixIcon = ({ width = 16, height = 16, style = {} }) => {
  return (
    <img
      src="/icons/pix.svg"
      alt="PIX"
      width={width}
      height={height}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    />
  );
};

export default PixIcon;
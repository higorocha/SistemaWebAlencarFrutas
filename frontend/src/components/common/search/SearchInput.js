// src/components/common/search/SearchInput.js
import React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const SearchInput = ({ placeholder, value, onChange, style }) => {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      allowClear
      prefix={<SearchOutlined />}
      size="large"
      style={{
        marginBottom: 16,
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        ...style,
      }}
    />
  );
};

SearchInput.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  style: PropTypes.object,
};

export default SearchInput; 
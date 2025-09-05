import React from 'react';
import { Autocomplete, TextField, } from "@mui/material";

const CustomAutocomplete = ({ options, label, value, onChange, getOptionLabel, renderOption }) => {
    return (
      <Autocomplete
        options={options}
        getOptionLabel={getOptionLabel}
        renderOption={renderOption}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            margin="dense"
            variant="outlined"
          />
        )}
        value={value}
        onChange={onChange}
      />
    );
  };
  

export default CustomAutocomplete;

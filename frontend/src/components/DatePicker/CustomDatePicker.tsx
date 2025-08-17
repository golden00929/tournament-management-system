import React, { useState, useEffect } from 'react';
import { TextField, Box, IconButton, InputAdornment } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';

interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helperText?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  required,
  helperText,
}) => {
  const formatDisplayValue = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [displayValue, setDisplayValue] = useState(() => formatDisplayValue(value));
  const [showNativePicker, setShowNativePicker] = useState(false);

  useEffect(() => {
    setDisplayValue(formatDisplayValue(value));
  }, [value]);


  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers and /
    if (!/[\d/]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'Tab') {
      event.preventDefault();
    }
  };

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    if (showNativePicker) return; // Don't format when using native picker
    
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, ''); // Only numbers
    
    // If empty, clear the value
    if (value === '') {
      setDisplayValue('');
      onChange('');
      return;
    }
    
    // Format as dd/MM/yyyy
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    setDisplayValue(value);
    
    // Check if complete date and valid
    if (value.length === 10) {
      const parts = value.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Create date using year-month-day format to avoid timezone issues
      const isoString = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const date = new Date(isoString);
      
      if (!isNaN(date.getTime()) && 
          date.getDate() === day && 
          date.getMonth() === month - 1 && 
          date.getFullYear() === year) {
        onChange(isoString);
      } else {
        // Invalid date, clear the onChange value but keep display value
        onChange('');
      }
    } else {
      // Incomplete date, clear the onChange value
      onChange('');
    }
  };

  const handleNativePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = event.target.value;
    onChange(isoDate);
    setShowNativePicker(false);
  };

  const handleCalendarClick = () => {
    setShowNativePicker(true);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        label={label}
        value={showNativePicker ? value : displayValue}
        type={showNativePicker ? 'date' : 'text'}
        onInput={handleInput}
        onChange={showNativePicker ? handleNativePickerChange : undefined}
        onKeyPress={!showNativePicker ? handleKeyPress : undefined}
        required={required}
        placeholder={!showNativePicker ? "dd/MM/yyyy" : undefined}
        inputProps={{
          maxLength: showNativePicker ? undefined : 10,
          lang: showNativePicker ? 'vi-VN' : undefined,
        }}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleCalendarClick}
                edge="end"
                size="small"
                title="달력에서 선택"
              >
                <CalendarToday />
              </IconButton>
            </InputAdornment>
          ),
        }}
        fullWidth
        helperText={helperText}
        onBlur={() => {
          if (showNativePicker) {
            setShowNativePicker(false);
          }
        }}
      />
    </Box>
  );
};

export default CustomDatePicker;
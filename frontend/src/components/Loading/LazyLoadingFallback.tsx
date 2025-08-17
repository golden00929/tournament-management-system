import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LazyLoadingFallbackProps {
  message?: string;
  size?: number;
  minHeight?: string | number;
}

/**
 * Reusable loading fallback component for lazy-loaded routes
 * Provides consistent loading experience across the application
 */
const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({
  message = '페이지를 로딩중입니다...',
  size = 40,
  minHeight = '300px'
}) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight={minHeight}
      flexDirection="column"
      gap={2}
      sx={{
        padding: 3,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 'none'
      }}
    >
      <CircularProgress 
        size={size} 
        thickness={4}
        sx={{
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          fontSize: '0.875rem',
          fontWeight: 400,
          textAlign: 'center'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LazyLoadingFallback;
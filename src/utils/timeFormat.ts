
import { format } from 'date-fns';

export const getTimeFormat = (): '12h' | '24h' => {
  return (localStorage.getItem('timeFormat') as '12h' | '24h') || '12h';
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeFormat = getTimeFormat();
  
  if (timeFormat === '24h') {
    return format(dateObj, 'HH:mm');
  } else {
    return format(dateObj, 'h:mm a');
  }
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeFormat = getTimeFormat();
  
  if (timeFormat === '24h') {
    return format(dateObj, 'MMM d, yyyy HH:mm');
  } else {
    return format(dateObj, 'MMM d, yyyy h:mm a');
  }
};

export const formatDateTimeShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeFormat = getTimeFormat();
  
  if (timeFormat === '24h') {
    return format(dateObj, 'MMM d HH:mm');
  } else {
    return format(dateObj, 'MMM d h:mm a');
  }
};

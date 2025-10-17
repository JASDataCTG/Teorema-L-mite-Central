import React from 'react';

export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

export const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M11 11V3a1 1 0 10-2 0v8H3a1 1 0 100 2h6v4a1 1 0 102 0v-4h6a1 1 0 100-2h-6z" />
        <path d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zM17 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1z" />
    </svg>
);

export const CalculatorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M13.28 3.47a.75.75 0 010 1.06L9.81 8l3.47 3.47a.75.75 0 11-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 01-1.06-1.06L7.69 8 4.22 4.53a.75.75 0 011.06-1.06L8.75 6.94l3.47-3.47a.75.75 0 011.06 0zM3.75 2A1.75 1.75 0 002 3.75v12.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 16.25V3.75A1.75 1.75 0 0016.25 2H3.75z" clipRule="evenodd" />
    </svg>
);

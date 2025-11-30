import React from 'react';

function StatusMessage({ message, type }) {
  const baseClasses = "px-8 py-4 mx-8 my-5 rounded-[10px] font-medium";
  
  const typeClasses = {
    success: "bg-[rgba(0,188,212,0.2)] text-newbiz-cyan border border-[rgba(0,188,212,0.4)]",
    error: "bg-[rgba(255,0,255,0.2)] text-newbiz-purple border border-[rgba(255,0,255,0.4)]",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.error}`}>
      {message}
    </div>
  );
}

export default StatusMessage;


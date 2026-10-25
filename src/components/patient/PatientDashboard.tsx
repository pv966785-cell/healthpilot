import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PatientHome } from './PatientHome';

export const PatientDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PatientHome />} />
      {/* Add other patient routes here */}
    </Routes>
  );
};

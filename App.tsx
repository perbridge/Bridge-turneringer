import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import TournamentDetails from './components/TournamentDetails';
import Layout from './components/Layout';
import ScoreEntryForm from './components/ScoreEntryForm';

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/tournament/:id" element={<TournamentDetails />} />
        <Route path="/score/:tournamentId/:tableNumber" element={<ScoreEntryForm />} />
      </Routes>
    </Layout>
  );
};

export default App;

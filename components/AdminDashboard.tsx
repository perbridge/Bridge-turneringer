import React, { useState } from 'react';
import { useTournaments } from '../contexts/TournamentsContext';
import { Link } from 'react-router-dom';
import CreateTournamentForm from './CreateTournamentForm';
import Card from './ui/Card';
import Button from './ui/Button';

const AdminDashboard: React.FC = () => {
  const { tournaments, deleteTournament } = useTournaments();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mine Turneringer</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create New Tournament'}
        </Button>
      </div>

      {showCreateForm && <CreateTournamentForm onClose={() => setShowCreateForm(false)} />}

      <Card>
        <h2 className="text-2xl font-semibold mb-4">Tournaments</h2>
        {tournaments.length === 0 ? (
          <p className="text-gray-500">Du har endnu ikke oprettet nogen turneringer. Klik på 'Create New Tournament' for at komme i gang.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b dark:border-gray-600">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Tables</th>
                  <th className="p-3">Pairs</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map(t => (
                  <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3">{t.date}</td>
                    <td className="p-3">{t.numTables}</td>
                    <td className="p-3">{t.numTables * 2}</td>
                    <td className="p-3 capitalize">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        t.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        t.status === 'running' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      <Link to={`/tournament/${t.id}`}>
                        <Button variant="secondary" size="sm">View</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => window.confirm('Are you sure?') && deleteTournament(t.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
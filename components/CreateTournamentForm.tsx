import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournaments } from '../contexts/TournamentsContext';
import { generateHowellMovement } from '../services/howellGenerator';
import { Tournament, Pair } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';

interface CreateTournamentFormProps {
  onClose: () => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onClose }) => {
  const { addTournament } = useTournaments();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [numTables, setNumTables] = useState(3);
  const [pairs, setPairs] = useState<Array<{ player1: string; player2: string }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const numPairs = numTables * 2;
    setPairs(currentPairs => {
      const newPairs = Array.from({ length: numPairs }, (_, i) => ({
        player1: currentPairs[i]?.player1 || '',
        player2: currentPairs[i]?.player2 || '',
      }));
      return newPairs;
    });
  }, [numTables]);

  const handlePairNameChange = (index: number, player: 'player1' | 'player2', value: string) => {
    const updatedPairs = [...pairs];
    updatedPairs[index][player] = value;
    setPairs(updatedPairs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const schedule = generateHowellMovement(numTables);
    if (!schedule) {
      setError(`Sorry, a Howell Movement schedule for ${numTables} tables is not supported in this version.`);
      return;
    }

    const finalPairs: Pair[] = pairs.map((p, index) => ({
      pairNumber: index + 1,
      player1: p.player1 || `Player ${index * 2 + 1}`,
      player2: p.player2 || `Player ${index * 2 + 2}`,
    }));

    const newTournament: Tournament = {
      id: Date.now().toString(),
      name,
      date,
      numTables,
      status: 'setup',
      schedule,
      results: [],
      pairs: finalPairs,
    };

    addTournament(newTournament);
    onClose();
    navigate(`/tournament/${newTournament.id}`);
  };

  return (
    <Card>
      <h2 className="text-2xl font-semibold mb-4">Create New Tournament</h2>
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tournament Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="numTables" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Tables</label>
            <select
              id="numTables"
              value={numTables}
              onChange={(e) => setNumTables(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="3">3 Tables (6 Pairs)</option>
              {/* Add more options here as more schedules are supported */}
            </select>
            <p className="text-xs text-gray-500 mt-1">Only 3 tables supported currently.</p>
          </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-2 border-b pb-2">Pair Names</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
            {pairs.map((pair, index) => (
                <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pair {index + 1}</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <input
                            type="text"
                            placeholder="Player 1"
                            value={pair.player1}
                            onChange={(e) => handlePairNameChange(index, 'player1', e.target.value)}
                            required
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                         <span className="text-gray-500">/</span>
                        <input
                            type="text"
                            placeholder="Player 2"
                            value={pair.player2}
                            onChange={(e) => handlePairNameChange(index, 'player2', e.target.value)}
                            required
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            ))}
            </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Tournament</Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateTournamentForm;
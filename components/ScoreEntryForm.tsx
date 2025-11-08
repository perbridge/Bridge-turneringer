import React, { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTournaments } from '../contexts/TournamentsContext';
import { Result } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';

const ScoreEntryPage: React.FC = () => {
  const { tournamentId, tableNumber: tableNumberStr } = useParams<{ tournamentId: string; tableNumber: string }>();
  const { tournaments, addResult } = useTournaments();

  const tournament = useMemo(() => tournaments.find(t => t.id === tournamentId), [tournaments, tournamentId]);
  const tableNumber = parseInt(tableNumberStr || '', 10);
  
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [boardNumber, setBoardNumber] = useState<number | null>(null);

  const [contract, setContract] = useState('');
  const [declarer, setDeclarer] = useState<'N' | 'S' | 'E' | 'W' | null>(null);
  const [isDoubled, setIsDoubled] = useState(false);
  const [isRedoubled, setIsRedoubled] = useState(false);
  const [tricks, setTricks] = useState<number | ''>('');
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
      setBoardNumber(null);
      setContract('');
      setDeclarer(null);
      setIsDoubled(false);
      setIsRedoubled(false);
      setTricks('');
      setError('');
  }

  const assignment = useMemo(() => {
    if (!tournament || !selectedRound) return null;
    // FIX: Added optional chaining `?.` before the final `.find`.
    // This prevents a crash if the assignments array is not found for the selected round.
    return tournament.schedule?.rounds
      .find(r => r.roundNumber === selectedRound)?.assignments
      ?.find(a => a.table === tableNumber);
  }, [tournament, selectedRound, tableNumber]);

  if (!tournamentId || !tableNumberStr || isNaN(tableNumber)) {
    return <Navigate to="/" />;
  }

  if (!tournament) {
      return (
      <Card>
        <h1 className="text-2xl font-bold">Tournament Not Found</h1>
        <p>The tournament you are looking for does not exist.</p>
      </Card>
    );
  }


  const getPairNames = (pairNumber: number): string => {
    const pair = tournament?.pairs.find(p => p.pairNumber === pairNumber);
    if (!pair) return `Pair ${pairNumber}`;
    return `${pair.player1} / ${pair.player2}`;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!assignment || !boardNumber || !declarer || tricks === '') {
        setError('Please fill out all fields.');
        return;
    }

    if (!/^[1-7](NT|[CSHD])$/i.test(contract)) {
      setError('Invalid contract format. Examples: 4S, 3NT, 1C.');
      return;
    }

    if (tricks < 0 || tricks > 13) {
      setError('Tricks must be between 0 and 13.');
      return;
    }

    const newResult: Omit<Result, 'scoreNS' | 'matchpointsNS' | 'matchpointsEW'> = {
      boardNumber,
      pairNS: assignment.ns,
      pairEW: assignment.ew,
      contract: contract.toUpperCase(),
      declarer,
      isDoubled,
      isRedoubled,
      tricks: Number(tricks),
    };

    addResult(tournamentId!, newResult);
    setSuccessMessage(`Result for board ${boardNumber} submitted successfully!`);
    resetForm();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">{tournament.name}</h1>
      <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-6">Score Entry - Table {tableNumber}</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="round" className="block text-sm font-medium">1. Select Round</label>
          <select
            id="round"
            value={selectedRound || ''}
            onChange={(e) => {
                setSelectedRound(e.target.value ? parseInt(e.target.value) : null);
                resetForm();
            }}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">-- Select a round --</option>
            {tournament.schedule?.rounds.map(r => (
              <option key={r.roundNumber} value={r.roundNumber}>Round {r.roundNumber}</option>
            ))}
          </select>
        </div>

        {assignment && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p><b>Playing this round:</b></p>
                <p><b>NS:</b> {getPairNames(assignment.ns)} (Pair {assignment.ns})</p>
                <p><b>EW:</b> {getPairNames(assignment.ew)} (Pair {assignment.ew})</p>
            </div>
        )}

        {assignment && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t dark:border-gray-600 pt-4 mt-4">
            {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{successMessage}</p>}
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="board" className="block text-sm font-medium">2. Select Board</label>
                     <select
                        id="board"
                        value={boardNumber || ''}
                        onChange={(e) => setBoardNumber(e.target.value ? parseInt(e.target.value) : null)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">-- Select board --</option>
                        {assignment.boards.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                </div>
                <div>
                    <label htmlFor="contract" className="block text-sm font-medium">3. Contract</label>
                    <input
                      type="text"
                      id="contract"
                      value={contract}
                      onChange={(e) => setContract(e.target.value)}
                      placeholder="e.g. 4S, 3NT"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

          <div>
            <label className="block text-sm font-medium">4. Declarer</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              <Button type="button" size="sm" variant={declarer === 'N' ? 'primary' : 'secondary'} onClick={() => setDeclarer('N')}>N</Button>
              <Button type="button" size="sm" variant={declarer === 'S' ? 'primary' : 'secondary'} onClick={() => setDeclarer('S')}>S</Button>
              <Button type="button" size="sm" variant={declarer === 'E' ? 'primary' : 'secondary'} onClick={() => setDeclarer('E')}>E</Button>
              <Button type="button" size="sm" variant={declarer === 'W' ? 'primary' : 'secondary'} onClick={() => setDeclarer('W')}>W</Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input type="checkbox" checked={isDoubled} onChange={e => { setIsDoubled(e.target.checked); if (e.target.checked) setIsRedoubled(false); }} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2">Doubled (X)</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={isRedoubled} onChange={e => { setIsRedoubled(e.target.checked); if (e.target.checked) setIsDoubled(false); }} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
              <span className="ml-2">Redoubled (XX)</span>
            </label>
          </div>

          <div>
            <label htmlFor="tricks" className="block text-sm font-medium">5. Tricks Taken</label>
            <input
              type="number"
              id="tricks"
              value={tricks}
              onChange={(e) => setTricks(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              min="0"
              max="13"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">Submit Result</Button>
          </div>
        </form>
        )}
      </div>
    </Card>
  );
};

export default ScoreEntryPage;
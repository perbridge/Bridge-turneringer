import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useTournaments } from '../contexts/TournamentsContext';
import { Standing, PairAssignment, Result, Pair } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { QRCodeSVG } from 'qrcode.react';

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tournaments, updateTournamentStatus, updateTournamentPairs } = useTournaments();
  const [activeTab, setActiveTab] = useState('schedule');

  // Find the tournament directly from the tournaments array
  const tournament = useMemo(() => tournaments.find(t => t.id === id), [tournaments, id]);

  const [isEditingPairs, setIsEditingPairs] = useState(false);
  const [editablePairs, setEditablePairs] = useState<Pair[]>([]);

  useEffect(() => {
    if (tournament) {
      // Deep copy to avoid mutating the original state directly
      setEditablePairs(JSON.parse(JSON.stringify(tournament.pairs)));
    }
  }, [tournament]);

  if (!id) {
    return <Navigate to="/" />;
  }

  const getPairNames = (pairNumber: number): string => {
    const pair = tournament?.pairs.find(p => p.pairNumber === pairNumber);
    if (!pair) return `Pair ${pairNumber}`;
    return `${pair.player1} / ${pair.player2}`;
  };

  const standings = useMemo((): Standing[] => {
    if (!tournament || tournament.status !== 'completed' || !tournament.results.length) {
      return [];
    }
    
    // Create a map of boards to their results to easily find max matchpoints per board
    const boardResultsMap = new Map<number, Result[]>();
    tournament.results.forEach(r => {
      if (!boardResultsMap.has(r.boardNumber)) boardResultsMap.set(r.boardNumber, []);
      boardResultsMap.get(r.boardNumber)!.push(r);
    });

    const boardMaxMp = new Map<number, number>();
    boardResultsMap.forEach((results, boardNumber) => {
        // Max possible matchpoints on a board is (number of scores - 1) * 2
        const maxMp = (results.length - 1) * 2;
        boardMaxMp.set(boardNumber, maxMp);
    });

    // Initialize scores for all pairs in the tournament
    const pairScores = new Map<number, { totalMatchpoints: number, totalPossible: number }>();
    tournament.pairs.forEach(p => {
        pairScores.set(p.pairNumber, { totalMatchpoints: 0, totalPossible: 0 });
    });

    // Tally matchpoints for each pair
    tournament.results.forEach(result => {
      const maxMpForBoard = boardMaxMp.get(result.boardNumber) || 0;
      
      const nsPair = pairScores.get(result.pairNS);
      if (nsPair) {
          nsPair.totalMatchpoints += result.matchpointsNS;
          nsPair.totalPossible += maxMpForBoard;
      }
      
      const ewPair = pairScores.get(result.pairEW);
      if (ewPair) {
          ewPair.totalMatchpoints += result.matchpointsEW;
          ewPair.totalPossible += maxMpForBoard;
      }
    });

    const calculatedStandings: Standing[] = [];
    pairScores.forEach((scoreData, pairNumber) => {
      // FIX: The root cause of the crash.
      // A division by zero error occurs if totalPossible is 0.
      // This check ensures we only calculate a percentage if it's possible.
      const percentage = scoreData.totalPossible > 0
        ? (scoreData.totalMatchpoints / scoreData.totalPossible) * 100
        : 0;

      const pairInfo = tournament.pairs.find(p => p.pairNumber === pairNumber);
      calculatedStandings.push({
        pair: pairNumber,
        playerNames: pairInfo ? `${pairInfo.player1} / ${pairInfo.player2}` : `Pair ${pairNumber}`,
        totalMatchpoints: scoreData.totalMatchpoints,
        percentage: percentage,
      });
    });

    return calculatedStandings.sort((a, b) => b.percentage - a.percentage);

  }, [tournament]);
  
  const getResultForAssignment = (assignment: PairAssignment, board: number): Result | undefined => {
      return tournament?.results.find(r => r.boardNumber === board && ((r.pairNS === assignment.ns && r.pairEW === assignment.ew) || (r.pairNS === assignment.ew && r.pairEW === assignment.ns)));
  }

  const handlePairNameChange = (index: number, player: 'player1' | 'player2', value: string) => {
    const updatedPairs = [...editablePairs];
    updatedPairs[index][player] = value;
    setEditablePairs(updatedPairs);
  };

  const handleSaveChanges = () => {
    if (id) {
      updateTournamentPairs(id, editablePairs);
      setIsEditingPairs(false);
    }
  };

  const handleCancelEdit = () => {
    if (tournament) {
      setEditablePairs(JSON.parse(JSON.stringify(tournament.pairs))); // Reset to original
      setIsEditingPairs(false);
    }
  };

  if (!tournament) {
    return (
      <Card>
        <h1 className="text-2xl font-bold">Tournament Not Found</h1>
        <p>The tournament you are looking for does not exist.</p>
      </Card>
    );
  }

  const TabButton = ({ tabName, label }: { tabName: string, label: string }) => (
    <li className="mr-2">
        <button
            onClick={() => setActiveTab(tabName)}
            className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === tabName
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
            }`}
        >
            {label}
        </button>
    </li>
  );

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            <p className="text-gray-500 mb-2">{tournament.date}</p>
            <Link to="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">&larr; Tilbage til oversigt</Link>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                tournament.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                tournament.status === 'running' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            }`}>
                {tournament.status}
            </span>
            <div className="flex space-x-2">
            {tournament.status === 'setup' && (
                <Button onClick={() => updateTournamentStatus(id, 'running')}>Start Tournament</Button>
            )}
            {tournament.status === 'running' && (
                <Button onClick={() => window.confirm('Are you sure you want to end this tournament? Results will be calculated.') && updateTournamentStatus(id, 'completed')}>End Tournament</Button>
            )}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
              <TabButton tabName="schedule" label="Schedule & Results" />
              <TabButton tabName="players" label="Players" />
              <TabButton tabName="standings" label="Standings" />
              <TabButton tabName="qrcodes" label="QR Codes" />
          </ul>
      </div>

      <div id="tabContent">
          {activeTab === 'schedule' && (
              <Card>
                <h2 className="text-2xl font-semibold mb-4">Schedule & Results</h2>
                <div className="space-y-6">
                  {tournament.schedule?.rounds.map(round => (
                    <div key={round.roundNumber}>
                      <h3 className="text-xl font-semibold mb-2">Round {round.roundNumber}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {round.assignments.map(assignment => (
                          <div key={assignment.table} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-baseline">
                                <p className="font-bold">Table {assignment.table}</p>
                                <div className="text-right text-sm">
                                    <p>NS: {getPairNames(assignment.ns)}</p>
                                    <p>EW: {getPairNames(assignment.ew)}</p>
                                </div>
                            </div>

                            {assignment.boards.map(board => {
                                const result = getResultForAssignment(assignment, board);
                                return (
                                    <div key={board} className="border-t dark:border-gray-600 pt-2 flex justify-between items-center">
                                        <p className="text-sm font-medium">Board: {board}</p>
                                        <div>
                                        {result ? (
                                            <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                                {result.contract} {result.tricks} tricks ({result.scoreNS > 0 ? `NS+${result.scoreNS}` : `EW+${-result.scoreNS}`})
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Awaiting score...</p>
                                        )}
                                        </div>
                                    </div>
                                )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
          )}

          {activeTab === 'players' && (
              <Card>
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-semibold">Player Names</h2>
                      {!isEditingPairs ? (
                          <Button onClick={() => setIsEditingPairs(true)}>Edit Player Names</Button>
                      ) : (
                          <div className="space-x-2">
                              <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
                              <Button onClick={handleSaveChanges}>Save Changes</Button>
                          </div>
                      )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
                      {editablePairs.sort((a,b) => a.pairNumber - b.pairNumber).map((pair, index) => (
                          <div key={pair.pairNumber}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pair {pair.pairNumber}</label>
                              <div className="flex items-center space-x-2 mt-1">
                                  <input
                                      type="text"
                                      placeholder="Player 1"
                                      value={pair.player1}
                                      disabled={!isEditingPairs}
                                      onChange={(e) => handlePairNameChange(index, 'player1', e.target.value)}
                                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                                  />
                                  <span className="text-gray-500">/</span>
                                  <input
                                      type="text"
                                      placeholder="Player 2"
                                      value={pair.player2}
                                      disabled={!isEditingPairs}
                                      onChange={(e) => handlePairNameChange(index, 'player2', e.target.value)}
                                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </Card>
          )}

          {activeTab === 'standings' && (
               <Card>
                <h2 className="text-2xl font-semibold mb-4">Standings</h2>
                 {tournament.status !== 'completed' || standings.length === 0 ? (
                    <p className="text-gray-500">Standings will be calculated once the tournament is completed.</p>
                 ) : (
                    <table className="w-full text-left">
                        <thead className="border-b dark:border-gray-600">
                        <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Pair</th>
                            <th className="p-3">Players</th>
                            <th className="p-3">Total MP</th>
                            <th className="p-3">Percentage</th>
                        </tr>
                        </thead>
                        <tbody>
                        {standings.map((s, index) => (
                            <tr key={s.pair} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-3 font-medium">{index + 1}</td>
                            <td className="p-3">{s.pair}</td>
                            <td className="p-3">{s.playerNames}</td>
                            <td className="p-3">{s.totalMatchpoints.toFixed(1)}</td>
                            <td className="p-3 font-semibold">{s.percentage.toFixed(2)}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                 )}
               </Card>
          )}

          {activeTab === 'qrcodes' && (
              <Card>
                  <h2 className="text-2xl font-semibold mb-4">QR Codes for Score Entry</h2>
                  <p className="text-gray-500 mb-6">Players can scan the QR code for their table to enter results directly.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                      {Array.from({ length: tournament.numTables }, (_, i) => i + 1).map(tableNum => {
                          // FIX: Use the robust `new URL()` constructor to guarantee a valid, scannable URL.
                          const qrCodeUrl = new URL(`#/score/${tournament.id}/${tableNum}`, window.location.href).href;
                          const linkPath = `/score/${tournament.id}/${tableNum}`;
                          
                          return (
                            <div key={tableNum} className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <h3 className="text-lg font-bold mb-2">Table {tableNum}</h3>
                                <QRCodeSVG 
                                  value={qrCodeUrl}
                                  size={200}
                                  bgColor={"#ffffff"}
                                  fgColor={"#000000"}
                                  level={"L"}
                                  includeMargin={true}
                                />
                                <Link 
                                  to={linkPath} 
                                  className="mt-4 text-sm text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  Link for Table {tableNum}
                                </Link>
                            </div>
                          );
                      })}
                  </div>
              </Card>
          )}
      </div>
    </div>
  );
};

export default TournamentDetails;
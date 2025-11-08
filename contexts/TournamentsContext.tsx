import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Tournament, Result, TournamentStatus, Pair } from '../types';
import { calculateAllMatchpoints } from '../services/bridgeScorer';

interface TournamentsContextType {
  tournaments: Tournament[];
  addTournament: (tournament: Tournament) => void;
  deleteTournament: (id: string) => void;
  updateTournamentStatus: (id: string, status: TournamentStatus) => void;
  updateTournamentPairs: (id: string, newPairs: Pair[]) => void;
  addResult: (tournamentId: string, result: Omit<Result, 'scoreNS' | 'matchpointsNS' | 'matchpointsEW'>) => void;
}

const TournamentsContext = createContext<TournamentsContextType | undefined>(undefined);

export const useTournaments = () => {
  const context = useContext(TournamentsContext);
  if (!context) {
    throw new Error('useTournaments must be used within a TournamentsProvider');
  }
  return context;
};

interface TournamentsProviderProps {
  children: ReactNode;
}

export const TournamentsProvider: React.FC<TournamentsProviderProps> = ({ children }) => {
  const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('bridge-tournaments', []);

  // NOTE: The data migration logic has been moved into the useLocalStorage hook itself.
  // This ensures it runs synchronously before the first render, preventing crashes
  // from old or corrupted data formats in localStorage.

  const addTournament = (tournament: Tournament) => {
    setTournaments(prev => [...prev, tournament]);
  };

  const deleteTournament = (id: string) => {
    setTournaments(prev => prev.filter(t => t.id !== id));
  };

  const updateTournamentStatus = (id: string, status: TournamentStatus) => {
     setTournaments(prev => prev.map(t => {
       if (t.id === id) {
         const updatedTournament = { ...t, status };
         if (status === 'completed') {
           updatedTournament.results = calculateAllMatchpoints(updatedTournament.results, updatedTournament.numTables * 2);
         }
         return updatedTournament;
       }
       return t;
     }));
  };

  const updateTournamentPairs = (id: string, newPairs: Pair[]) => {
    setTournaments(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, pairs: newPairs };
      }
      return t;
    }));
  };

  const addResult = (tournamentId: string, newResultData: Omit<Result, 'scoreNS' | 'matchpointsNS' | 'matchpointsEW'>) => {
     // The bridgeScorer service will calculate the scoreNS, but matchpoints are calculated at the end.
     const dummyResultWithScore = { ...newResultData, scoreNS: 0, matchpointsNS: 0, matchpointsEW: 0 };
     
     setTournaments(prev => prev.map(t => {
       if (t.id === tournamentId) {
         // Prevent duplicate board results for the same pair
         const existingResultIndex = t.results.findIndex(r => r.boardNumber === newResultData.boardNumber && (r.pairNS === newResultData.pairNS || r.pairEW === newResultData.pairEW));
         
         const newResults = [...t.results];
         if(existingResultIndex !== -1) {
            newResults[existingResultIndex] = dummyResultWithScore;
         } else {
            newResults.push(dummyResultWithScore);
         }
         
         return { ...t, results: newResults };
       }
       return t;
     }));
  };

  return (
    <TournamentsContext.Provider value={{ tournaments, addTournament, deleteTournament, updateTournamentStatus, addResult, updateTournamentPairs }}>
      {children}
    </TournamentsContext.Provider>
  );
};
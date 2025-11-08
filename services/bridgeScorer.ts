import { Result } from '../types';

// Simplified scoring, assumes non-vulnerable for all
const getContractBaseScore = (suit: string, level: number): number => {
  const isMinor = suit === 'C' || suit === 'D';
  if (isMinor) return 20 * level;
  const isMajor = suit === 'H' || suit === 'S';
  if (isMajor) return 30 * level;
  // No Trump
  return 40 + 30 * (level - 1);
};

const getSlamBonus = (level: number, made: boolean): number => {
  if (!made) return 0;
  if (level === 6) return 500; // Small slam
  if (level === 7) return 1000; // Grand slam
  return 0;
};

const getGameBonus = (score: number, made: boolean): number => {
  if (!made) return 0;
  return score >= 100 ? 300 : 50;
};

export const calculateContractScore = (contract: string, tricks: number, isDoubled: boolean, isRedoubled: boolean): number => {
  const level = parseInt(contract[0], 10);
  const suit = contract.substring(1).toUpperCase();
  const requiredTricks = 6 + level;
  const overtricks = tricks - requiredTricks;

  if (overtricks < 0) { // Contract failed
    const undertricks = -overtricks;
    if (!isDoubled && !isRedoubled) {
      return -50 * undertricks;
    }
    if (isDoubled) {
      return -100 - (undertricks - 1) * 200; // Simplified
    }
    if (isRedoubled) {
      return -200 - (undertricks - 1) * 400; // Simplified
    }
  }

  // Contract made
  let score = getContractBaseScore(suit, level);
  if (isDoubled) score *= 2;
  if (isRedoubled) score *= 4;

  let overtrickValue = 0;
  if (suit === 'C' || suit === 'D') overtrickValue = 20;
  if (suit === 'H' || suit === 'S' || suit === 'NT') overtrickValue = 30;

  if (isDoubled) overtrickValue = 100;
  if (isRedoubled) overtrickValue = 200;
  
  score += overtricks * overtrickValue;

  score += getGameBonus(getContractBaseScore(suit, level), true);
  score += getSlamBonus(level, true);

  return score;
};


export const calculateAllMatchpoints = (results: Result[], numPairs: number): Result[] => {
  const boards = new Map<number, Result[]>();
  results.forEach(res => {
    if (!boards.has(res.boardNumber)) {
      boards.set(res.boardNumber, []);
    }
    const scoreNS = calculateContractScore(res.contract, res.tricks, res.isDoubled, res.isRedoubled) * (res.declarer === 'N' || res.declarer === 'S' ? 1 : -1);
    const updatedRes = { ...res, scoreNS };
    boards.get(res.boardNumber)!.push(updatedRes);
  });

  const finalResults: Result[] = [];
  
  boards.forEach((boardResults) => {
    const processedBoardResults = boardResults.map(result => {
      let matchpointsNS = 0;
      boardResults.forEach(otherResult => {
        if (result.scoreNS > otherResult.scoreNS) {
          matchpointsNS += 2;
        } else if (result.scoreNS === otherResult.scoreNS) {
          matchpointsNS += 1;
        }
      });
      // The loop includes a self-comparison which adds 1 point, so we subtract it.
      matchpointsNS -= 1;

      const maxMatchpoints = (boardResults.length - 1) * 2;
      
      return {
        ...result,
        matchpointsNS: matchpointsNS,
        matchpointsEW: maxMatchpoints - matchpointsNS,
      };
    });
    finalResults.push(...processedBoardResults);
  });
  
  return finalResults;
};
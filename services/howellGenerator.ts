
import { Schedule, Round } from '../types';

// This is a standard Howell Movement schedule for 3 tables (6 pairs)
const howellFor3Tables: Schedule = {
  rounds: [
    {
      roundNumber: 1,
      assignments: [
        { table: 1, ns: 1, ew: 6, boards: [1, 2] },
        { table: 2, ns: 5, ew: 4, boards: [3, 4] },
        { table: 3, ns: 3, ew: 2, boards: [5, 6] },
      ],
    },
    {
      roundNumber: 2,
      assignments: [
        { table: 1, ns: 1, ew: 4, boards: [5, 6] },
        { table: 2, ns: 6, ew: 3, boards: [1, 2] },
        { table: 3, ns: 2, ew: 5, boards: [3, 4] },
      ],
    },
    {
      roundNumber: 3,
      assignments: [
        { table: 1, ns: 1, ew: 2, boards: [3, 4] },
        // Fix: Corrected typo `_blank 6` to `6`
        { table: 2, ns: 4, ew: 6, boards: [5, 6] },
        { table: 3, ns: 5, ew: 3, boards: [1, 2] },
      ],
    },
    {
      roundNumber: 4,
      assignments: [
        { table: 1, ns: 1, ew: 5, boards: [7, 8] },
        { table: 2, ns: 2, ew: 4, boards: [9, 10] },
        { table: 3, ns: 3, ew: 6, boards: [11, 12] },
      ],
    },
     {
      roundNumber: 5,
      assignments: [
        { table: 1, ns: 1, ew: 3, boards: [9, 10] },
        { table: 2, ns: 5, ew: 2, boards: [11, 12] },
        { table: 3, ns: 6, ew: 4, boards: [7, 8] },
      ],
    },
  ],
};


export const generateHowellMovement = (numTables: number): Schedule | null => {
  // For now, we only support 3 tables as per the example.
  // This could be expanded with more hardcoded schedules or a full algorithm.
  if (numTables === 3) {
    return howellFor3Tables;
  }
  
  // Return null if no schedule is available for the given number of tables.
  return null;
};
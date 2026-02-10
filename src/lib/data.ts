import {
  Tournament,
  PokerTable,
  Seat,
  Player,
  BlindLevel,
  Prizepool,
  Notification,
  TournamentState,
  RedrawAssignment,
} from "./types";

// ── Realistic player names ──────────────────────────────────────────
const PLAYER_NAMES = [
  "James Chen", "Maria Rodriguez", "David Kim", "Sarah Thompson",
  "Michael Park", "Jennifer Walsh", "Robert Liu", "Amanda Foster",
  "William Zhang", "Emily Carter", "Daniel Nguyen", "Jessica Moore",
  "Christopher Lee", "Ashley Davis", "Matthew Wilson", "Stephanie Brown",
  "Andrew Martinez", "Nicole Taylor", "Joshua Anderson", "Samantha Thomas",
  "Kevin Hernandez", "Rachel Garcia", "Brandon Jackson", "Lauren White",
  "Tyler Robinson", "Megan Clark", "Ryan Lewis", "Brittany Hall",
  "Justin Young", "Kayla Allen", "Aaron King", "Olivia Wright",
  "Nathan Scott", "Hannah Green", "Patrick Adams", "Victoria Baker",
  "Sean Gonzalez", "Courtney Nelson", "Derek Hill", "Amber Ramirez",
  "Marcus Campbell", "Tiffany Mitchell", "Troy Roberts", "Christina Turner",
  "Dustin Phillips", "Vanessa Evans", "Cody Edwards", "Monica Collins",
  "Brett Stewart", "Diana Sanchez", "Shane Morris", "Laura Rogers",
  "Grant Reed", "Natalie Cook", "Blake Morgan", "Michelle Bell",
  "Ivan Murphy", "Heather Bailey", "Oscar Rivera", "Alexis Cooper",
  "Felix Howard", "Jade Ward", "Leo Torres", "Sophia Peterson",
  "Hugo Gray", "Chloe Ramirez", "Theo James", "Ella Flores",
  "Max Bennett", "Lily Wood", "Simon Barnes", "Zoe Ross",
  "Caleb Henderson", "Ruby Coleman", "Owen Jenkins", "Nora Perry",
  "Elijah Powell", "Maya Long", "Isaac Patterson", "Stella Hughes",
];

let playerIdCounter = 0;
function createPlayer(name: string, tableId: string, seatNumber: number, chipRange: [number, number]): Player {
  playerIdCounter++;
  const chips = Math.floor(Math.random() * (chipRange[1] - chipRange[0]) + chipRange[0]);
  // Round to nearest 100
  const roundedChips = Math.round(chips / 100) * 100;
  return {
    id: `player-${playerIdCounter}`,
    name,
    chipCount: roundedChips,
    tableId,
    seatNumber,
  };
}

function createSeats(
  tableId: string,
  tableNumber: number,
  handsPerTable: number,
  playerNames: string[],
  chipRange: [number, number],
  startIdx: number,
  emptySeats: number[] = []
): { seats: Seat[]; nextIdx: number } {
  const seats: Seat[] = [];
  let idx = startIdx;

  for (let pos = 1; pos <= handsPerTable; pos++) {
    if (emptySeats.includes(pos) || idx >= playerNames.length) {
      seats.push({ position: pos, player: null });
    } else {
      seats.push({
        position: pos,
        player: createPlayer(playerNames[idx], tableId, pos, chipRange),
      });
      idx++;
    }
  }

  return { seats, nextIdx: idx };
}

function createTables(
  tournamentId: string,
  tableCount: number,
  handsPerTable: number,
  playerNames: string[],
  chipRange: [number, number],
  emptySeatsMap: Record<number, number[]> = {}
): PokerTable[] {
  const tables: PokerTable[] = [];
  let nameIdx = 0;

  for (let t = 1; t <= tableCount; t++) {
    const tableId = `${tournamentId}-table-${t}`;
    const { seats, nextIdx } = createSeats(
      tableId,
      t,
      handsPerTable,
      playerNames,
      chipRange,
      nameIdx,
      emptySeatsMap[t] || []
    );
    nameIdx = nextIdx;

    tables.push({
      id: tableId,
      number: t,
      seats,
    });
  }

  return tables;
}

// ── Blind structures ────────────────────────────────────────────────

const ploBlinds: BlindLevel[] = [
  { level: 1, smallBlind: 100, bigBlind: 200, ante: 200, duration: 30 },
  { level: 2, smallBlind: 200, bigBlind: 300, ante: 300, duration: 30 },
  { level: 3, smallBlind: 200, bigBlind: 400, ante: 400, duration: 30 },
  { level: 4, smallBlind: 300, bigBlind: 600, ante: 600, duration: 30, isBreak: false },
  { level: 5, smallBlind: 400, bigBlind: 800, ante: 800, duration: 30 },
  { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 7, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 30 },
  { level: 8, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 30 },
  { level: 9, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 30 },
  { level: 10, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 30 },
  { level: 11, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 12, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 30 },
  { level: 13, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 30 },
  { level: 14, smallBlind: 2500, bigBlind: 5000, ante: 5000, duration: 30 },
  { level: 15, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 30 },
];

const deepstackBlinds: BlindLevel[] = [
  { level: 1, smallBlind: 100, bigBlind: 100, ante: 100, duration: 30 },
  { level: 2, smallBlind: 100, bigBlind: 200, ante: 200, duration: 30 },
  { level: 3, smallBlind: 100, bigBlind: 300, ante: 300, duration: 30 },
  { level: 4, smallBlind: 200, bigBlind: 400, ante: 400, duration: 30 },
  { level: 5, smallBlind: 200, bigBlind: 500, ante: 500, duration: 30 },
  { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 7, smallBlind: 300, bigBlind: 600, ante: 600, duration: 30 },
  { level: 8, smallBlind: 400, bigBlind: 800, ante: 800, duration: 30 },
  { level: 9, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 30 },
  { level: 10, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 30 },
  { level: 11, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 12, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 30 },
  { level: 13, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 30 },
  { level: 14, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 30 },
  { level: 15, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 30 },
];

const closerBlinds: BlindLevel[] = [
  { level: 1, smallBlind: 100, bigBlind: 200, ante: 200, duration: 30 },
  { level: 2, smallBlind: 200, bigBlind: 400, ante: 400, duration: 30 },
  { level: 3, smallBlind: 300, bigBlind: 600, ante: 600, duration: 30 },
  { level: 4, smallBlind: 400, bigBlind: 800, ante: 800, duration: 30 },
  { level: 5, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 30 },
  { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 7, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 30 },
  { level: 8, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 30 },
  { level: 9, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 30 },
  { level: 10, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 30 },
  { level: 11, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 12, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 30 },
  { level: 13, smallBlind: 2500, bigBlind: 5000, ante: 5000, duration: 30 },
  { level: 14, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 30 },
  { level: 15, smallBlind: 4000, bigBlind: 8000, ante: 8000, duration: 30 },
];

const seniorsEventBlinds: BlindLevel[] = [
  { level: 1, smallBlind: 50, bigBlind: 100, ante: 100, duration: 40 },
  { level: 2, smallBlind: 100, bigBlind: 200, ante: 200, duration: 40 },
  { level: 3, smallBlind: 100, bigBlind: 300, ante: 300, duration: 40 },
  { level: 4, smallBlind: 200, bigBlind: 400, ante: 400, duration: 40 },
  { level: 5, smallBlind: 200, bigBlind: 500, ante: 500, duration: 40 },
  { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true },
  { level: 7, smallBlind: 300, bigBlind: 600, ante: 600, duration: 40 },
  { level: 8, smallBlind: 400, bigBlind: 800, ante: 800, duration: 40 },
  { level: 9, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 40 },
  { level: 10, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 40 },
  { level: 11, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true },
  { level: 12, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 40 },
  { level: 13, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 40 },
  { level: 14, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 40 },
  { level: 15, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 40 },
];

// ── Prizepool data ──────────────────────────────────────────────────

const ploPrizepool: Prizepool = {
  guaranteed: 40000,
  totalEntries: 112,
  totalPool: 44800,
  placesPaid: 15,
  breakdown: [
    { place: "1st", amount: 12544, percentage: 28.0 },
    { place: "2nd", amount: 8512, percentage: 19.0 },
    { place: "3rd", amount: 5824, percentage: 13.0 },
    { place: "4th", amount: 4032, percentage: 9.0 },
    { place: "5th", amount: 3136, percentage: 7.0 },
    { place: "6th", amount: 2464, percentage: 5.5 },
    { place: "7th", amount: 1971, percentage: 4.4 },
    { place: "8th", amount: 1568, percentage: 3.5 },
    { place: "9th", amount: 1254, percentage: 2.8 },
    { place: "10th", amount: 986, percentage: 2.2 },
    { place: "11th-12th", amount: 762, percentage: 1.7 },
    { place: "13th-15th", amount: 583, percentage: 1.3 },
  ],
};

const deepstackPrizepool: Prizepool = {
  guaranteed: 50000,
  totalEntries: 0,
  totalPool: 50000,
  placesPaid: 15,
  breakdown: [
    { place: "1st", amount: 14000, percentage: 28.0 },
    { place: "2nd", amount: 9500, percentage: 19.0 },
    { place: "3rd", amount: 6500, percentage: 13.0 },
    { place: "4th", amount: 4500, percentage: 9.0 },
    { place: "5th", amount: 3500, percentage: 7.0 },
    { place: "6th", amount: 2750, percentage: 5.5 },
    { place: "7th", amount: 2200, percentage: 4.4 },
    { place: "8th", amount: 1750, percentage: 3.5 },
    { place: "9th-10th", amount: 1250, percentage: 2.5 },
    { place: "11th-15th", amount: 750, percentage: 1.5 },
  ],
};

const closerPrizepool: Prizepool = {
  guaranteed: 75000,
  totalEntries: 0,
  totalPool: 75000,
  placesPaid: 15,
  breakdown: [
    { place: "1st", amount: 21000, percentage: 28.0 },
    { place: "2nd", amount: 14250, percentage: 19.0 },
    { place: "3rd", amount: 9750, percentage: 13.0 },
    { place: "4th", amount: 6750, percentage: 9.0 },
    { place: "5th", amount: 5250, percentage: 7.0 },
    { place: "6th", amount: 4125, percentage: 5.5 },
    { place: "7th", amount: 3300, percentage: 4.4 },
    { place: "8th", amount: 2625, percentage: 3.5 },
    { place: "9th-10th", amount: 1875, percentage: 2.5 },
    { place: "11th-15th", amount: 1125, percentage: 1.5 },
  ],
};

const seniorsEventPrizepool: Prizepool = {
  guaranteed: 20000,
  totalEntries: 0,
  totalPool: 20000,
  placesPaid: 10,
  breakdown: [
    { place: "1st", amount: 5600, percentage: 28.0 },
    { place: "2nd", amount: 3800, percentage: 19.0 },
    { place: "3rd", amount: 2600, percentage: 13.0 },
    { place: "4th", amount: 1800, percentage: 9.0 },
    { place: "5th", amount: 1400, percentage: 7.0 },
    { place: "6th", amount: 1100, percentage: 5.5 },
    { place: "7th-8th", amount: 900, percentage: 4.5 },
    { place: "9th-10th", amount: 700, percentage: 3.5 },
  ],
};

// ── $5K Championship (Final Table) ──────────────────────────────────

const championshipBlinds: BlindLevel[] = [
  { level: 1, smallBlind: 100, bigBlind: 200, ante: 200, duration: 60 },
  { level: 2, smallBlind: 200, bigBlind: 400, ante: 400, duration: 60 },
  { level: 3, smallBlind: 300, bigBlind: 600, ante: 600, duration: 60 },
  { level: 4, smallBlind: 400, bigBlind: 800, ante: 800, duration: 60 },
  { level: 5, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 60 },
  { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true },
  { level: 7, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 60 },
  { level: 8, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 60 },
  { level: 9, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 60 },
  { level: 10, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 60 },
  { level: 11, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true },
  { level: 12, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 60 },
  { level: 13, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 60 },
  { level: 14, smallBlind: 4000, bigBlind: 8000, ante: 8000, duration: 60 },
  { level: 15, smallBlind: 5000, bigBlind: 10000, ante: 10000, duration: 60 },
  { level: 16, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true },
  { level: 17, smallBlind: 8000, bigBlind: 15000, ante: 15000, duration: 60 },
  { level: 18, smallBlind: 10000, bigBlind: 20000, ante: 20000, duration: 60 },
  { level: 19, smallBlind: 15000, bigBlind: 30000, ante: 30000, duration: 60 },
  { level: 20, smallBlind: 20000, bigBlind: 40000, ante: 40000, duration: 60 },
  { level: 21, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true },
  { level: 22, smallBlind: 25000, bigBlind: 50000, ante: 50000, duration: 60 },
  { level: 23, smallBlind: 30000, bigBlind: 60000, ante: 60000, duration: 60 },
  { level: 24, smallBlind: 40000, bigBlind: 80000, ante: 80000, duration: 60 },
  { level: 25, smallBlind: 50000, bigBlind: 100000, ante: 100000, duration: 60 },
];

const championshipPrizepool: Prizepool = {
  guaranteed: 500000,
  totalEntries: 118,
  totalPool: 590000,
  placesPaid: 18,
  breakdown: [
    { place: "1st", amount: 159300, percentage: 27.0 },
    { place: "2nd", amount: 106200, percentage: 18.0 },
    { place: "3rd", amount: 76700, percentage: 13.0 },
    { place: "4th", amount: 53100, percentage: 9.0 },
    { place: "5th", amount: 41300, percentage: 7.0 },
    { place: "6th", amount: 32450, percentage: 5.5 },
    { place: "7th", amount: 25960, percentage: 4.4 },
    { place: "8th", amount: 20650, percentage: 3.5 },
    { place: "9th", amount: 16520, percentage: 2.8 },
    { place: "10th", amount: 12980, percentage: 2.2 },
    { place: "11th-12th", amount: 10030, percentage: 1.7 },
    { place: "13th-15th", amount: 7670, percentage: 1.3 },
    { place: "16th-18th", amount: 5900, percentage: 1.0 },
  ],
};

// ── $1K NLH (3-Table Redraw) ────────────────────────────────────────

const redrawNlhBlinds: BlindLevel[] = [
  { level: 1, smallBlind: 100, bigBlind: 200, ante: 200, duration: 30 },
  { level: 2, smallBlind: 200, bigBlind: 300, ante: 300, duration: 30 },
  { level: 3, smallBlind: 200, bigBlind: 400, ante: 400, duration: 30 },
  { level: 4, smallBlind: 300, bigBlind: 600, ante: 600, duration: 30 },
  { level: 5, smallBlind: 400, bigBlind: 800, ante: 800, duration: 30 },
  { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 7, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 30 },
  { level: 8, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 30 },
  { level: 9, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 30 },
  { level: 10, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 30 },
  { level: 11, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 12, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 30 },
  { level: 13, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 30 },
  { level: 14, smallBlind: 2500, bigBlind: 5000, ante: 5000, duration: 30 },
  { level: 15, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 30 },
];

const redrawNlhPrizepool: Prizepool = {
  guaranteed: 100000,
  totalEntries: 132,
  totalPool: 132000,
  placesPaid: 18,
  breakdown: [
    { place: "1st", amount: 35640, percentage: 27.0 },
    { place: "2nd", amount: 23760, percentage: 18.0 },
    { place: "3rd", amount: 17160, percentage: 13.0 },
    { place: "4th", amount: 11880, percentage: 9.0 },
    { place: "5th", amount: 9240, percentage: 7.0 },
    { place: "6th", amount: 7260, percentage: 5.5 },
    { place: "7th-8th", amount: 5280, percentage: 4.0 },
    { place: "9th-12th", amount: 3300, percentage: 2.5 },
    { place: "13th-18th", amount: 2112, percentage: 1.6 },
  ],
};

// ── Build tournaments ───────────────────────────────────────────────

// Shuffle names for variety
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Player names specifically for the final table (famous-sounding)
const FINAL_TABLE_NAMES = [
  "Viktor Blom", "Vanessa Selbst", "Phil Ivey",
  "Daniel Negreanu", "Bryn Kenney", "Maria Ho", "Jason Koon",
];

// Player names for the $1K NLH (redraw tournament)
const REDRAW_NAMES = [
  "Tommy Angelo", "Liv Boeree", "Chris Moneymaker", "Annette Obrestad",
  "Erik Seidel", "Kathy Liebert", "Gus Hansen", "Jennifer Tilly",
  "Scotty Nguyen", "Vanessa Rousso", "Barry Greenstein", "Annie Duke",
  "Allen Cunningham", "Liz Lieu", "Mike Matusow", "Evelyn Ng",
  "John Juanda", "Linda Johnson", "Ted Forrest", "Joanne Liu",
  "Huck Seed", "Jan Fisher", "Men Nguyen", "Barbara Enright",
];

function buildInitialState(): TournamentState {
  playerIdCounter = 0;

  // Use deterministic "random" — reset seed via fixed ordering
  const ploNames = PLAYER_NAMES.slice(0, 58);

  // PLO: 8 tables, 8-handed, ~58 players → some tables have 7
  const ploTables = createTables(
    "plo",
    8,
    8,
    ploNames,
    [8000, 45000],
    { 3: [7], 6: [4, 8], 7: [2], 8: [5, 6] } // some empty seats
  );

  // Championship Final Table: 1 table, 9-handed, 7 players (deep stacks)
  const ftTables = createTables(
    "championship",
    1,
    9,
    FINAL_TABLE_NAMES,
    [800000, 3200000],
    { 1: [8, 9] } // seats 8+9 empty
  );

  // $1K NLH: 3 tables, 8-handed, 24 players — all seats full (pre-redraw)
  const redrawTables = createTables(
    "redraw-nlh",
    3,
    8,
    REDRAW_NAMES,
    [20000, 75000],
    {} // all seats full
  );

  // Build pending redraw assignments — shuffle all 24 players to new seats
  const allRedrawPlayers: { playerId: string; playerName: string; fromTable: number; fromSeat: number }[] = [];
  for (const table of redrawTables) {
    for (const seat of table.seats) {
      if (seat.player) {
        allRedrawPlayers.push({
          playerId: seat.player.id,
          playerName: seat.player.name,
          fromTable: table.number,
          fromSeat: seat.position,
        });
      }
    }
  }
  // Shuffle for new assignments — deterministic-ish rotation
  const shuffledForRedraw = [...allRedrawPlayers];
  // Simple rotate: shift every player forward by a prime offset
  const offset = 7;
  const newPositions = shuffledForRedraw.map((_, i) => {
    const newIdx = (i + offset) % shuffledForRedraw.length;
    const newTable = Math.floor(newIdx / 8) + 1;
    const newSeat = (newIdx % 8) + 1;
    return { toTable: newTable, toSeat: newSeat };
  });
  const pendingRedraw: RedrawAssignment[] = allRedrawPlayers.map((p, i) => ({
    ...p,
    toTable: newPositions[i].toTable,
    toSeat: newPositions[i].toSeat,
  }));

  const tournaments: Tournament[] = [
    {
      id: "plo",
      name: "$400 PLO",
      buyIn: 400,
      status: "live",
      tables: ploTables,
      blindStructure: ploBlinds,
      prizepool: ploPrizepool,
      lateRegEndLevel: 8,
      currentLevel: 5,
      clockRunning: true,
      clockTimeRemaining: 1047, // 17:27
      handsPerTable: 8,
      startingChips: 20000,
      gameType: "Pot-Limit Omaha",
    },
    {
      id: "championship",
      name: "$5,000 Championship",
      buyIn: 5000,
      status: "live",
      tables: ftTables,
      blindStructure: championshipBlinds,
      prizepool: championshipPrizepool,
      lateRegEndLevel: 9,
      currentLevel: 22,
      clockRunning: false, // paused for final table drama
      clockTimeRemaining: 2847, // 47:27
      handsPerTable: 9,
      startingChips: 50000,
      gameType: "No-Limit Hold'em",
    },
    {
      id: "redraw-nlh",
      name: "$1,000 NLH",
      buyIn: 1000,
      status: "live",
      tables: redrawTables,
      blindStructure: redrawNlhBlinds,
      prizepool: redrawNlhPrizepool,
      lateRegEndLevel: 8,
      currentLevel: 10,
      clockRunning: false, // paused for redraw
      clockTimeRemaining: 1800, // full level remaining
      handsPerTable: 8,
      startingChips: 30000,
      gameType: "No-Limit Hold'em",
      pendingRedraw: pendingRedraw,
    },
    {
      id: "deepstack",
      name: "$500 Deepstack",
      buyIn: 500,
      status: "upcoming",
      tables: [],
      blindStructure: deepstackBlinds,
      prizepool: deepstackPrizepool,
      lateRegEndLevel: 8,
      currentLevel: 1,
      clockRunning: false,
      clockTimeRemaining: 1800,
      handsPerTable: 9,
      startingChips: 30000,
      gameType: "No-Limit Hold'em",
    },
    {
      id: "seniors",
      name: "$200 Seniors Event",
      buyIn: 200,
      status: "upcoming",
      tables: [],
      blindStructure: seniorsEventBlinds,
      prizepool: seniorsEventPrizepool,
      lateRegEndLevel: 10,
      currentLevel: 1,
      clockRunning: false,
      clockTimeRemaining: 2400,
      handsPerTable: 9,
      startingChips: 20000,
      gameType: "No-Limit Hold'em",
    },
    {
      id: "closer",
      name: "$750 Closer",
      buyIn: 750,
      status: "upcoming",
      tables: [],
      blindStructure: closerBlinds,
      prizepool: closerPrizepool,
      lateRegEndLevel: 6,
      currentLevel: 1,
      clockRunning: false,
      clockTimeRemaining: 1800,
      handsPerTable: 8,
      startingChips: 25000,
      gameType: "No-Limit Hold'em",
    },
  ];

  const notifications: Notification[] = [
    {
      id: "notif-1",
      type: "level",
      title: "Level Change",
      message: "Level 5 starting — Blinds 400/800/800",
      timestamp: Date.now() - 120000,
      read: false,
      tournamentId: "plo",
    },
    {
      id: "notif-2",
      type: "redraw",
      title: "Table Rebalance Needed",
      message: "Table 6 has 6 players. Move Dustin Phillips (Table 6, Seat 3) → Table 3, Seat 7",
      timestamp: Date.now() - 300000,
      read: false,
      tournamentId: "plo",
    },
    {
      id: "notif-3",
      type: "registration",
      title: "Late Registration",
      message: "Late registration for $400 PLO closes at end of Level 8",
      timestamp: Date.now() - 600000,
      read: true,
      tournamentId: "plo",
    },
    // Championship final table notifications
    {
      id: "notif-6",
      type: "alert",
      title: "Final Table",
      message: "Final table reached — 7 players remaining. Clock paused.",
      timestamp: Date.now() - 60000,
      read: false,
      tournamentId: "championship",
    },
    {
      id: "notif-7",
      type: "level",
      title: "Level Change",
      message: "Level 22 starting — Blinds 25,000/50,000/50,000",
      timestamp: Date.now() - 180000,
      read: true,
      tournamentId: "championship",
    },
    // $1K NLH redraw notifications
    {
      id: "notif-8",
      type: "redraw",
      title: "3-Table Redraw Required",
      message: "24 players remaining — complete redraw to 3 tables of 8. Clock paused.",
      timestamp: Date.now() - 30000,
      read: false,
      tournamentId: "redraw-nlh",
    },
    {
      id: "notif-9",
      type: "level",
      title: "Level Change",
      message: "Level 10 starting — Blinds 1,000/2,000/2,000",
      timestamp: Date.now() - 240000,
      read: true,
      tournamentId: "redraw-nlh",
    },
  ];

  return {
    tournaments,
    selectedTournamentId: "plo",
    notifications,
  };
}

// Singleton initial state (deterministic)
export const INITIAL_STATE: TournamentState = buildInitialState();

// List of names for adding new players
const EXTRA_NAMES = [
  "Alex Mercer", "Jordan Blake", "Casey Quinn", "Riley Morgan",
  "Taylor Nash", "Quinn Avery", "Sage Donovan", "Phoenix Hart",
  "Reese Canton", "Avery Sinclair", "Parker Wolfe", "Dakota Lane",
  "Morgan Steele", "Cameron Drake", "Jamie Frost", "Rowan Pierce",
];

export function getRandomNewPlayerName(): string {
  return EXTRA_NAMES[Math.floor(Math.random() * EXTRA_NAMES.length)];
}

export function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

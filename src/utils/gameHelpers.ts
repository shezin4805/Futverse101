import { Player, PLAYERS } from "../data/players";

export type CompareStatus = "correct" | "partial" | "incorrect";

export interface AttributeComparison {
  value: string | number;
  status: CompareStatus;
  direction?: "up" | "down" | "equal";
}

export interface PlayerComparison {
  name: string;
  nationality: AttributeComparison;
  club: AttributeComparison;
  league: AttributeComparison;
  position: AttributeComparison;
  age: AttributeComparison;
  shirtNumber: AttributeComparison;
  dominantFoot: AttributeComparison;
  height: AttributeComparison;
  competitions: AttributeComparison;
}

export type GameMode =
  | "Premier League"
  | "La Liga"
  | "Serie A"
  | "Bundesliga"
  | "Ligue 1"
  | "All Leagues"
  | "UEFA Mode"
  | "FIFA Club World Cup"
  | "FIFA World Cup"
  | "Everything Mode";

export type Difficulty = "Easy" | "Medium" | "Hard";

// Filter players by game mode
export function filterPlayersByMode(players: Player[], mode: GameMode): Player[] {
  switch (mode) {
    case "Premier League":
      return players.filter((p) => p.league === "Premier League");
    case "La Liga":
      return players.filter((p) => p.league === "La Liga");
    case "Serie A":
      return players.filter((p) => p.league === "Serie A");
    case "Bundesliga":
      return players.filter((p) => p.league === "Bundesliga");
    case "Ligue 1":
      return players.filter((p) => p.league === "Ligue 1");
    case "All Leagues": {
      const allowed = [
        "Premier League",
        "La Liga",
        "Serie A",
        "Bundesliga",
        "Ligue 1",
        "Saudi Pro League",
        "MLS",
        "Eredivisie",
        "Primeira Liga",
      ];
      return players.filter((p) => allowed.includes(p.league));
    }
    case "UEFA Mode":
      return players.filter((p) =>
        p.competitions.some(
          (c) =>
            c.includes("UEFA Champions League") ||
            c.includes("UEFA Europa League") ||
            c.includes("UEFA Conference League") ||
            c.includes("UEFA Super Cup")
        )
      );
    case "FIFA Club World Cup":
      return players.filter((p) =>
        p.competitions.some((c) => c.includes("FIFA Club World Cup"))
      );
    case "FIFA World Cup":
      return players.filter((p) =>
        p.competitions.some((c) => c.includes("FIFA World Cup"))
      );
    case "Everything Mode":
    default:
      return players;
  }
}

// Compare continent mapping for nationality partial match
export const CONTINENTS: Record<string, string> = {
  Argentina: "South America",
  Brazil: "South America",
  Uruguay: "South America",
  Portugal: "Europe",
  France: "Europe",
  Norway: "Europe",
  England: "Europe",
  Belgium: "Europe",
  Poland: "Europe",
  Croatia: "Europe",
  Netherlands: "Europe",
  Spain: "Europe",
  "South Korea": "Asia",
  Japan: "Asia",
  Germany: "Europe",
  Nigeria: "Africa",
  Egypt: "Africa",
  Morocco: "Africa",
  Ghana: "Africa",
  Turkey: "Europe",
  Serbia: "Europe",
  Georgia: "Europe",
  Slovenia: "Europe",
  Gabon: "Africa",
  Sweden: "Europe",
  Switzerland: "Europe",
};

// Compare two players and return detailed status
export function comparePlayers(guessed: Player, target: Player): PlayerComparison {
  // 1. Nationality
  let nationalityStatus: CompareStatus = "incorrect";
  if (guessed.nationality === target.nationality) {
    nationalityStatus = "correct";
  } else if (guessed.continent === target.continent) {
    nationalityStatus = "partial"; // Same continent
  }

  // 2. Club
  let clubStatus: CompareStatus = "incorrect";
  if (guessed.club === target.club) {
    clubStatus = "correct";
  } else if (
    target.transferHistory.includes(guessed.club) ||
    guessed.transferHistory.includes(target.club)
  ) {
    clubStatus = "partial"; // Played for each other's club historically
  }

  // 3. League
  let leagueStatus: CompareStatus = "incorrect";
  if (guessed.league === target.league) {
    leagueStatus = "correct";
  } else if (
    // Both leagues in top 5
    ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"].includes(guessed.league) &&
    ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"].includes(target.league)
  ) {
    leagueStatus = "partial";
  }

  // 4. Position
  let positionStatus: CompareStatus = "incorrect";
  if (guessed.position === target.position) {
    positionStatus = "correct";
  } else if (guessed.positionGroup === target.positionGroup) {
    positionStatus = "partial"; // Same area (FW, MF, DF, GK)
  }

  // 5. Age
  const ageDiff = Math.abs(guessed.age - target.age);
  const ageStatus: CompareStatus =
    guessed.age === target.age ? "correct" : ageDiff <= 2 ? "partial" : "incorrect";
  const ageDirection =
    guessed.age < target.age ? "up" : guessed.age > target.age ? "down" : "equal";

  // 6. Shirt Number
  const numberDiff = Math.abs(guessed.shirtNumber - target.shirtNumber);
  const shirtNumberStatus: CompareStatus =
    guessed.shirtNumber === target.shirtNumber
      ? "correct"
      : numberDiff <= 3
      ? "partial"
      : "incorrect";
  const shirtNumberDirection =
    guessed.shirtNumber < target.shirtNumber
      ? "up"
      : guessed.shirtNumber > target.shirtNumber
      ? "down"
      : "equal";

  // 7. Dominant Foot
  const footStatus: CompareStatus =
    guessed.dominantFoot === target.dominantFoot
      ? "correct"
      : guessed.dominantFoot === "Ambidextrous" || target.dominantFoot === "Ambidextrous"
      ? "partial"
      : "incorrect";

  // 8. Height
  const heightDiff = Math.abs(guessed.height - target.height);
  const heightStatus: CompareStatus =
    guessed.height === target.height
      ? "correct"
      : heightDiff <= 5
      ? "partial"
      : "incorrect";
  const heightDirection =
    guessed.height < target.height
      ? "up"
      : guessed.height > target.height
      ? "down"
      : "equal";

  // 9. Competitions
  const commonCompetitions = guessed.competitions.filter((c) =>
    target.competitions.includes(c)
  );
  let competitionsStatus: CompareStatus = "incorrect";
  let compValue = "None";

  if (commonCompetitions.length > 0) {
    compValue = commonCompetitions.join(", ");
    if (guessed.competitions.length === target.competitions.length && 
        commonCompetitions.length === guessed.competitions.length) {
      competitionsStatus = "correct";
    } else {
      competitionsStatus = "partial";
    }
  }

  return {
    name: guessed.name,
    nationality: { value: guessed.nationality, status: nationalityStatus },
    club: { value: guessed.club, status: clubStatus },
    league: { value: guessed.league, status: leagueStatus },
    position: { value: guessed.position, status: positionStatus },
    age: { value: guessed.age, status: ageStatus, direction: ageDirection },
    shirtNumber: { value: guessed.shirtNumber, status: shirtNumberStatus, direction: shirtNumberDirection },
    dominantFoot: { value: guessed.dominantFoot, status: footStatus },
    height: { value: `${guessed.height} cm`, status: heightStatus, direction: heightDirection },
    competitions: { value: compValue, status: competitionsStatus },
  };
}

// Simple Elo calculator
export function calculateElo(
  userRating: number,
  won: boolean,
  solvedWithoutHints: boolean,
  solvedQuickly: boolean
): number {
  let change = won ? 25 : -15;
  if (won && solvedWithoutHints) change += 5;
  if (won && solvedQuickly) change += 5;

  return Math.max(100, userRating + change); // Min rating is 100
}

// Rating to Rank conversion
export function getRankFromRating(rating: number): string {
  if (rating < 1100) return "Newbie";
  if (rating < 1300) return "Amateur";
  if (rating < 1500) return "Intermediate";
  if (rating < 1800) return "Pro";
  if (rating < 2100) return "Elite";
  if (rating < 2500) return "Legend";
  return "GOAT";
}

// Generate shared daily player based on the current date
export function getDailyPlayer(players: Player[]): Player {
  // Use today's date as seed
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  
  // Simple hashing of the string
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % players.length;
  return players[index];
}

export interface ClanGroup {
  id: string;
  name: string;     // From Row 1 (Index 0)
  tag: string;      // From Row 2 (Index 1)
  status: string;   // From Row 3 (Index 2)
  note: string;     // From Row 4 (Index 3)
  members: string[]; // From Rows 6-20 (Index 5-19)
}

export interface SheetData {
  name: string;
  groups: ClanGroup[];
}

export interface MemberWeight {
  [name: string]: number;
}

export interface ParseResult {
  sheets: SheetData[];
  importedWeights: MemberWeight;
}

export interface AnalysisRequest {
  groups: ClanGroup[];
  weights: MemberWeight;
}

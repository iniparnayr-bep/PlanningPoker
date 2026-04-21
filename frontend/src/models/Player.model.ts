export interface Player {
    name: string;
    token: string;
    estimate: number | null;
    isOwner: boolean;
    id: string;
    avatar?: string;
}

export interface ExportPlayer {
    name: string;
    avatar?: string;
}

export interface ExportEstimatePlayer {
    name: string;
    id: string;
    estimate: number | null;
    isOwner: boolean;
    avatar?: string;
}

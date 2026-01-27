export interface PlayerStats {
    lp: number;
    damage: number;
    crit: number;        // Critical hit chance in %
    critdamage: number;  // Critical hit damage in %
    bulletpersecond: number;
    bulletdistance: number;
    bulletspeed: number;
    credits: number;
}

export const DefaultPlayerStats: PlayerStats = {
    lp: 100,
    damage: 10,
    crit: 5,
    critdamage: 150,
    bulletpersecond: 2,
    bulletdistance: 300,
    bulletspeed: 200,
    credits: 0
};

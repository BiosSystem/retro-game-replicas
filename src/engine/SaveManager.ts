export interface ScoreData {
    score: number;
    name: string;
}
import { AchievementManager } from './AchievementManager';

export class SaveManager {
    private static STORAGE_KEY_V1 = 'bios_arcade_saves_v1';
    private static STORAGE_KEY_V2 = 'bios_arcade_saves_v2';
    
    // Schema: { gameName: { difficulty: { score: 1000, name: 'AAA' } } }
    private static data: Record<string, Record<string, ScoreData>> = {};

    public static initialize() {
        try {
            const rawV2 = localStorage.getItem(this.STORAGE_KEY_V2);
            if (rawV2) {
                this.data = JSON.parse(rawV2);
            } else {
                // Migrate V1 to V2
                const rawV1 = localStorage.getItem(this.STORAGE_KEY_V1);
                if (rawV1) {
                    const dataV1 = JSON.parse(rawV1) as Record<string, Record<string, number>>;
                    for (const game in dataV1) {
                        this.data[game] = {};
                        for (const diff in dataV1[game]) {
                            this.data[game][diff] = {
                                score: dataV1[game][diff],
                                name: 'AAA' // Default migrated name
                            };
                        }
                    }
                    this.save();
                }
            }
        } catch (e) {
            console.warn('Failed to load save data:', e);
            this.data = {};
        }
    }

    public static getHighScoreData(game: string, difficulty: string): ScoreData {
        if (!this.data[game] || !this.data[game][difficulty]) {
            return { score: 0, name: '---' };
        }
        return this.data[game][difficulty];
    }

    public static getHighScore(game: string, difficulty: string): number {
        return this.getHighScoreData(game, difficulty).score;
    }

    public static isHighScore(game: string, difficulty: string, score: number): boolean {
        return score > this.getHighScore(game, difficulty);
    }

    public static submitScore(game: string, difficulty: string, score: number, name: string = 'AAA'): boolean {
        AchievementManager.recordScore(score);

        if (!this.data[game]) {
            this.data[game] = {};
        }

        if (this.isHighScore(game, difficulty, score)) {
            this.data[game][difficulty] = { score, name };
            this.save();
            return true; // New High Score
        }
        return false;
    }

    private static save() {
        try {
            localStorage.setItem(this.STORAGE_KEY_V2, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to write save data:', e);
        }
    }
}

export class SaveManager {
    private static STORAGE_KEY = 'bios_arcade_saves_v1';
    private static data: Record<string, Record<string, number>> = {};

    public static initialize() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                this.data = JSON.parse(raw);
            }
        } catch (e) {
            console.warn('Failed to load save data:', e);
            this.data = {};
        }
    }

    public static getHighScore(game: string, difficulty: string): number {
        if (!this.data[game]) return 0;
        return this.data[game][difficulty] || 0;
    }

    public static submitScore(game: string, difficulty: string, score: number): boolean {
        if (!this.data[game]) {
            this.data[game] = {};
        }

        const currentHigh = this.getHighScore(game, difficulty);
        if (score > currentHigh) {
            this.data[game][difficulty] = score;
            this.save();
            return true; // New High Score
        }
        return false;
    }

    private static save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to write save data:', e);
        }
    }
}

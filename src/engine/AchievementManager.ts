import { AudioEngine } from './AudioEngine';

export interface Achievement {
    id: string;
    title: string;
    description: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
    'first_blood': { id: 'first_blood', title: 'First Blood', description: 'Score your first point in any game.' },
    'centurion': { id: 'centurion', title: 'Centurion', description: 'Reach a score of 100 in any game.' },
    'arcade_rat': { id: 'arcade_rat', title: 'Arcade Rat', description: 'Play 5 different games.' },
    'dedicated': { id: 'dedicated', title: 'Dedicated', description: 'Play 10 games total.' }
};

export class AchievementManager {
    private static STORAGE_KEY = 'retro_achievements_v1';
    private static unlocked: Set<string> = new Set();
    
    // Stats for unlocking
    private static gamesPlayed: Set<string> = new Set();
    private static totalPlays = 0;

    public static initialize() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                this.unlocked = new Set(data.unlocked || []);
                this.gamesPlayed = new Set(data.gamesPlayed || []);
                this.totalPlays = data.totalPlays || 0;
            }
        } catch (e) {
            console.warn('Failed to load achievements', e);
        }
    }

    private static save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
            unlocked: Array.from(this.unlocked),
            gamesPlayed: Array.from(this.gamesPlayed),
            totalPlays: this.totalPlays
        }));
    }

    public static getUnlocked(): string[] {
        return Array.from(this.unlocked);
    }

    public static unlock(id: string) {
        if (!ACHIEVEMENTS[id] || this.unlocked.has(id)) return;
        
        this.unlocked.add(id);
        this.save();
        this.showToast(ACHIEVEMENTS[id]);
    }

    public static recordPlay(gameId: string) {
        this.gamesPlayed.add(gameId);
        this.totalPlays++;
        this.save();

        if (this.gamesPlayed.size >= 5) this.unlock('arcade_rat');
        if (this.totalPlays >= 10) this.unlock('dedicated');
    }

    public static recordScore(score: number) {
        if (score > 0) this.unlock('first_blood');
        if (score >= 100) this.unlock('centurion');
    }

    private static showToast(ach: Achievement) {
        AudioEngine.playTone(800, 'sine', 0.1);
        setTimeout(() => AudioEngine.playTone(1200, 'sine', 0.2), 100);

        const toast = document.createElement('div');
        toast.style.position = 'absolute';
        toast.style.top = '-80px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(0, 20, 10, 0.9)';
        toast.style.border = '2px solid #00ffcc';
        toast.style.borderRadius = '8px';
        toast.style.padding = '10px 20px';
        toast.style.color = '#fff';
        toast.style.fontFamily = "'Share Tech Mono', monospace";
        toast.style.zIndex = '10000';
        toast.style.textAlign = 'center';
        toast.style.boxShadow = '0 0 15px #00ffcc';
        toast.style.transition = 'top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        toast.style.pointerEvents = 'none';

        toast.innerHTML = `
            <div style="color: #00ffcc; font-size: 12px; margin-bottom: 4px;">ACHIEVEMENT UNLOCKED</div>
            <div style="font-size: 18px; font-weight: bold;">🏆 ${ach.title}</div>
        `;

        document.body.appendChild(toast);

        // Slide in
        requestAnimationFrame(() => {
            toast.style.top = '20px';
        });

        // Slide out
        setTimeout(() => {
            toast.style.top = '-80px';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 500);
        }, 4000);
    }
}

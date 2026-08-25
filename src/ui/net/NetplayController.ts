import { PeerLink, type PeerStatus } from '../../net/PeerLink';
import { inputChecksum, type NetInputFrame } from '../../net/InputCodec';
import { InputManager } from '../../engine/InputManager';
import { PresenceMesh, type PresenceState } from '../../hub/ArcadeHallSystems';
import { createSwarmIdentity, ScoreGossip, type GossipEnvelope } from '../../net/swarm/ScoreGossip';
import { SwarmScoreStore } from '../../net/swarm/SwarmScoreStore';

export class NetplayController {
  private readonly root: HTMLElement; private peer: PeerLink;
  private readonly mesh = new PresenceMesh(); private readonly peerId = `peer-${Math.random().toString(36).slice(2,10)}`; private hubState?: Omit<PresenceState, 'peerId' | 'frame'>; private presenceFrame = 0;
  private readonly peers: PeerLink[] = []; private readonly gossip = new ScoreGossip(); private readonly identity = createSwarmIdentity(); private readonly scoreStore = new SwarmScoreStore();
  constructor() {
    this.peer = this.createPeer();
    this.root = document.createElement('aside'); this.root.className = 'netplay-panel'; this.root.hidden = true;
    this.root.innerHTML = `<header><div><small>BIOSSYSTEM DIRECT LINK</small><h2>P2P NETPLAY</h2></div><button type="button" data-close>X</button></header><p>Exchange one room code per direct peer. Add up to eight links for Meta-Arcade presence. Configure TURN outside the bundle when relay service is required.</p><div class="netplay-actions"><button type="button" data-peer>ADD MESH PEER</button><button type="button" data-host>CREATE HOST CODE</button><button type="button" data-join>ACCEPT HOST CODE</button><button type="button" data-answer>ACCEPT ANSWER</button></div><textarea data-code spellcheck="false" aria-label="WebRTC room code" placeholder="Paste ARC1 room code"></textarea><output data-status>IDLE</output>`;
    document.body.appendChild(this.root); this.bind(); void this.hydrateScores(); requestAnimationFrame(() => this.tick());
  }
  toggle(force?: boolean) { this.root.hidden = force === undefined ? !this.root.hidden : !force; }
  async mergeScores(envelope:GossipEnvelope){await this.receiveGossip(envelope);return this.gossip.top(undefined,10);}
  swarmTop(){return this.gossip.top(undefined,10);}
  private bind() {
    document.getElementById('netplay-toggle')?.addEventListener('click', () => this.toggle()); this.pick('[data-close]').addEventListener('click', () => this.toggle(false));
    this.pick('[data-host]').addEventListener('click', () => void this.run(async () => this.write(await this.peer.createHostCode())));
    this.pick('[data-join]').addEventListener('click', () => void this.run(async () => this.write(await this.peer.acceptHostCode(this.read()))));
    this.pick('[data-answer]').addEventListener('click', () => void this.run(async () => { await this.peer.acceptAnswerCode(this.read()); }));
    this.pick('[data-peer]').addEventListener('click', () => { this.peer = this.createPeer(); this.write(''); this.status('NEW PEER READY'); });
    this.mesh.addEventListener('presence', event => window.dispatchEvent(new CustomEvent('arcade-hub-presence', { detail: (event as CustomEvent).detail })));
    window.addEventListener('arcade-hub-local', event => { const detail = (event as CustomEvent).detail as { x?: unknown; y?: unknown; angle?: unknown }; if ([detail.x, detail.y, detail.angle].every(Number.isFinite)) this.hubState = { x: Number(detail.x), y: Number(detail.y), angle: Number(detail.angle) }; });
    window.addEventListener('arcade-score-submit', event => { const detail = (event as CustomEvent).detail as { game?:unknown;score?:unknown;name?:unknown }; if(typeof detail.game==='string'&&typeof detail.score==='number')void this.publishScore(String(detail.name??'AAA'),detail.game,detail.score); });
    window.addEventListener('keydown', event => { if (event.code === 'KeyN' && !(event.target as HTMLElement | null)?.matches('input, textarea, select')) this.toggle(); if (event.code === 'Escape' && !this.root.hidden) this.toggle(false); });
  }
  private async run(action: () => Promise<void>) { try { this.status('NEGOTIATING'); await action(); this.status(this.peer.getStatus()); } catch (error) { this.status(error instanceof Error ? error.message : 'NETPLAY ERROR'); } }
  private frame = 0;
  private tick() { const frame = ++this.frame; if (this.peer.getStatus() === 'CONNECTED') { const buttons = (InputManager.isP1Down('UP') ? 1 : 0) | (InputManager.isP1Down('DOWN') ? 2 : 0) | (InputManager.isP1Down('LEFT') ? 4 : 0) | (InputManager.isP1Down('RIGHT') ? 8 : 0) | (InputManager.isP1Down('FIRE') ? 16 : 0); const axisX = buttons & 4 ? -127 : buttons & 8 ? 127 : 0; const axisY = buttons & 1 ? -127 : buttons & 2 ? 127 : 0; this.peer.sendInput({ frame, buttons, axisX, axisY, checksum: inputChecksum(frame, buttons, axisX, axisY) }); } if (this.hubState && frame % 6 === 0) this.mesh.broadcast({ peerId: this.peerId, ...this.hubState, frame: ++this.presenceFrame }); requestAnimationFrame(() => this.tick()); }
  private createPeer() { const peer = new PeerLink(loadIceConfiguration()); this.peers.push(peer); this.mesh.add(peer); peer.addEventListener('status', event => this.status((event as CustomEvent<PeerStatus>).detail)); peer.addEventListener('input', event => { const input = (event as CustomEvent<NetInputFrame>).detail; InputManager.setNetworkPlayerState({ UP: Boolean(input.buttons & 1), DOWN: Boolean(input.buttons & 2), LEFT: Boolean(input.buttons & 4), RIGHT: Boolean(input.buttons & 8), FIRE: Boolean(input.buttons & 16) }); }); peer.addEventListener('control', event => { const detail=(event as CustomEvent).detail;this.mesh.receive(detail);void this.receiveGossip(detail); }); return peer; }
  private async publishScore(player:string,game:string,score:number){const replay=localStorage.getItem('retro_replay_latest_v1');let replayHash='0'.repeat(64);try{replayHash=String((JSON.parse(replay??'null')as{sha256?:string}|null)?.sha256??replayHash);}catch{replayHash='0'.repeat(64);}const claim=await this.gossip.create(player,game,score,replayHash,await this.identity);await this.scoreStore.put(claim);this.broadcast(this.gossip.envelope());this.emitBoard();}
  private async receiveGossip(value:unknown){if(!value||typeof value!=='object'||(value as{type?:unknown}).type!=='SCORE_GOSSIP')return;const added=await this.gossip.merge(value as GossipEnvelope);if(!added)return;for(const claim of this.gossip.top(undefined,added))await this.scoreStore.put(claim);this.broadcast(this.gossip.envelope());this.emitBoard();}
  private async hydrateScores(){try{await this.gossip.merge({type:'SCORE_GOSSIP',claims:await this.scoreStore.all()});this.emitBoard();}catch{return;}}
  private broadcast(value:unknown){for(const peer of this.peers)peer.sendControl(value);}
  private emitBoard(){window.dispatchEvent(new CustomEvent('arcade-swarm-board',{detail:this.gossip.top(undefined,10)}));}
  private read() { return (this.pick('[data-code]') as HTMLTextAreaElement).value.trim(); }
  private write(value: string) { (this.pick('[data-code]') as HTMLTextAreaElement).value = value; }
  private status(value: string) { this.pick('[data-status]').textContent = value; }
  private pick(selector: string) { const element = this.root.querySelector<HTMLElement>(selector); if (!element) throw new Error(`Missing netplay element: ${selector}`); return element; }
}

function loadIceConfiguration(): RTCConfiguration { try { const raw = localStorage.getItem('retro_ice_servers_v1'); if (!raw) return {}; const value: unknown = JSON.parse(raw); if (!Array.isArray(value) || value.length > 4) return {}; const iceServers = value.flatMap(item => validIceServer(item) ? [item] : []); return { iceServers }; } catch { return {}; } }
function validIceServer(value: unknown): value is RTCIceServer { if (!record(value)) return false; const urls = typeof value.urls === 'string' ? [value.urls] : Array.isArray(value.urls) ? value.urls : []; return urls.length > 0 && urls.length <= 4 && urls.every(url => typeof url === 'string' && /^(stun|turns?):/.test(url) && url.length < 512) && (value.username === undefined || typeof value.username === 'string') && (value.credential === undefined || typeof value.credential === 'string'); }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function installNetplayController() { return new NetplayController(); }

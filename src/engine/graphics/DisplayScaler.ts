export type DisplayAspect = '4:3' | '16:9';

export interface DisplayViewport {
  aspect: DisplayAspect;
  scale: number;
  integerScaled: boolean;
  contentWidth: number;
  contentHeight: number;
  contentLeft: number;
  contentTop: number;
  frameWidth: number;
  frameHeight: number;
  frameLeft: number;
  frameTop: number;
}

export function parseDisplayAspect(value: string | null): DisplayAspect { return value === '16:9' ? '16:9' : '4:3'; }

export function calculateIntegerViewport(containerWidth: number, containerHeight: number, sourceWidth = 640, sourceHeight = 480, aspect: DisplayAspect = '4:3'): DisplayViewport {
  const safeContainerWidth = finitePositive(containerWidth);
  const safeContainerHeight = finitePositive(containerHeight);
  const safeSourceWidth = finitePositive(sourceWidth);
  const safeSourceHeight = finitePositive(sourceHeight);
  const logicalFrameWidth = aspect === '16:9' ? Math.ceil(safeSourceHeight * 16 / 9) : Math.ceil(safeSourceHeight * 4 / 3);
  const logicalFrameHeight = safeSourceHeight;
  const fit = Math.min(safeContainerWidth / logicalFrameWidth, safeContainerHeight / logicalFrameHeight);
  const integerScale = Math.floor(fit);
  const integerScaled = integerScale >= 1;
  const scale = integerScaled ? integerScale : Math.max(0.01, fit);
  const contentWidth = safeSourceWidth * scale;
  const contentHeight = safeSourceHeight * scale;
  const frameWidth = logicalFrameWidth * scale;
  const frameHeight = logicalFrameHeight * scale;
  return {
    aspect,
    scale,
    integerScaled,
    contentWidth,
    contentHeight,
    contentLeft: (safeContainerWidth - contentWidth) / 2,
    contentTop: (safeContainerHeight - contentHeight) / 2,
    frameWidth,
    frameHeight,
    frameLeft: (safeContainerWidth - frameWidth) / 2,
    frameTop: (safeContainerHeight - frameHeight) / 2,
  };
}

export class DisplayScaler {
  private aspect: DisplayAspect = '4:3';
  private readonly surfaces = new Set<HTMLCanvasElement>();
  private readonly resizeObserver: ResizeObserver | null;
  private viewport: DisplayViewport;

  constructor(privateContainer: HTMLElement, sourceCanvas: HTMLCanvasElement, extraSurfaces: readonly HTMLCanvasElement[] = []) {
    this.container = privateContainer;
    this.viewport = calculateIntegerViewport(privateContainer.clientWidth, privateContainer.clientHeight, sourceCanvas.width, sourceCanvas.height, this.aspect);
    this.registerSurface(sourceCanvas, 'game');
    for (const surface of extraSurfaces) this.registerSurface(surface, surface.dataset.arcadeSurface ?? 'post');
    this.resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.refresh());
    this.resizeObserver?.observe(privateContainer);
    for (const surface of this.surfaces) this.resizeObserver?.observe(surface);
    if (!this.resizeObserver && typeof window !== 'undefined') window.addEventListener('resize', this.refresh);
    this.refresh();
  }

  private readonly container: HTMLElement;

  setAspect(aspect: DisplayAspect) { this.aspect = aspect; this.refresh(); }
  get currentAspect() { return this.aspect; }
  get currentViewport() { return { ...this.viewport }; }

  registerSurface(surface: HTMLCanvasElement, role = 'post') {
    surface.classList.add('arcade-display-surface');
    surface.dataset.arcadeSurface = role;
    this.surfaces.add(surface);
    this.applySurface(surface, this.viewport);
  }

  refresh = () => {
    const source = [...this.surfaces][0];
    if (!source) return;
    this.viewport = calculateIntegerViewport(this.container.clientWidth, this.container.clientHeight, source.width, source.height, this.aspect);
    this.container.dataset.displayAspect = this.aspect.replace(':', 'x');
    this.container.dataset.integerScale = this.viewport.integerScaled ? `${this.viewport.scale}` : 'FIT';
    this.container.style.setProperty('--display-frame-width', `${this.viewport.frameWidth}px`);
    this.container.style.setProperty('--display-frame-height', `${this.viewport.frameHeight}px`);
    this.container.style.setProperty('--display-frame-left', `${this.viewport.frameLeft}px`);
    this.container.style.setProperty('--display-frame-top', `${this.viewport.frameTop}px`);
    this.container.style.setProperty('--display-content-width', `${this.viewport.contentWidth}px`);
    this.container.style.setProperty('--display-content-height', `${this.viewport.contentHeight}px`);
    this.container.style.setProperty('--display-content-left', `${this.viewport.contentLeft}px`);
    this.container.style.setProperty('--display-content-top', `${this.viewport.contentTop}px`);
    for (const surface of this.surfaces) this.applySurface(surface, this.viewport);
  };

  destroy() {
    this.resizeObserver?.disconnect();
    if (!this.resizeObserver && typeof window !== 'undefined') window.removeEventListener('resize', this.refresh);
  }

  private applySurface(surface: HTMLCanvasElement, viewport: DisplayViewport) {
    if (!viewport) return;
    surface.style.setProperty('position', 'absolute', 'important');
    surface.style.setProperty('left', `${viewport.contentLeft}px`, 'important');
    surface.style.setProperty('top', `${viewport.contentTop}px`, 'important');
    surface.style.setProperty('width', `${viewport.contentWidth}px`, 'important');
    surface.style.setProperty('height', `${viewport.contentHeight}px`, 'important');
    surface.style.setProperty('margin', '0', 'important');
    surface.style.setProperty('transform', 'none', 'important');
  }
}

function finitePositive(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}

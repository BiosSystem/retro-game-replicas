import { describe, expect, it } from 'vitest';
import { VectorHistory } from '../VectorCanvasView';
import { createVectorDocument } from '../../../core/graphics/vector/VectorArtModel';

describe('vector workshop history', () => {
  it('bounds undo history and restores snapshots', () => { const history = new VectorHistory(2); const first = createVectorDocument(); const second = createVectorDocument(); second.width = 320; const third = createVectorDocument(); third.width = 480; history.commit(first); history.commit(second); history.commit(third); expect(history.undoDepth).toBe(2); expect(history.undo(createVectorDocument())?.width).toBe(480); });
});

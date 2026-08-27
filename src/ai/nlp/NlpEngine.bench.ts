import { bench, describe } from 'vitest';
import { TinyInt4Transformer } from './TinyTransformer';
const model = new TinyInt4Transformer(0x50415241);
describe('local transformer inference', () => { bench('generate 100 INT4 dialogue tokens', () => { for (let i = 0; i < 10; i++) model.generate('portal shadow vault guard gravity corridor', 10, i); }); });

import { minify } from 'terser';
import type { OutputChunk, Plugin } from 'vite';

export function finalMinifyPlugin(): Plugin {
  return {
    name: 'biossystem-final-minify',
    apply: 'build',
    enforce: 'post',
    async generateBundle(_options, bundle) {
      await Promise.all(Object.values(bundle).map(async output => {
        if (output.type !== 'chunk') return;
        const result = await minify((output as OutputChunk).code, {
          module: true,
          compress: { passes: 2 },
          mangle: true,
          format: { comments: false },
        });
        if (result.code) output.code = result.code;
      }));
    },
  };
}

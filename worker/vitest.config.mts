import { resolve } from 'node:path';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	resolve: {
		// tsc and wrangler's esbuild bundler both read `paths` straight from
		// tsconfig.json, but Vitest's own Vite resolver doesn't — it needs the
		// alias spelled out here too.
		alias: {
			'@shared': resolve(__dirname, '../shared'),
		},
	},
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.jsonc' },
			},
		},
	},
});

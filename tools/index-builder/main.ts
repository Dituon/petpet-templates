import config from './config.json'
import fs from 'fs';
import { buildOldTemplateIndex } from './old-template-builder';
import { buildTemplateIndex } from './template-builder';

(async () => {
    const results = {
        ...buildOldTemplateIndex(config),
        ... await buildTemplateIndex(config)
    }
    for (const path in results) {
        fs.writeFileSync(path, results[path])
    }
})()
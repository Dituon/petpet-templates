import fs from 'fs';
import path from 'path';
import {Config, TemplateData} from './types';

const rootDir: string = process.cwd()

export function buildOldTemplateIndex(config: Config): Record<string, string> {
    const basePath: string = path.join(rootDir, config.basePath);
    const templatesPath: string = path.join(basePath, config.path);
    const fontsPath: string = path.join(basePath, config.fontsPath);

    const lengthMap: Record<string, number> = {};
    const aliasMap: Record<string, string[]> = {};
    const typeMap: Record<string, string> = {};

    const oldTemplatesList: string[] = fs.readdirSync(templatesPath)
        .filter((template: string) => {
            const templatePath: string = path.join(templatesPath, template);
            const filePath: string = path.join(templatePath, 'data.json');
            if (!fs.existsSync(filePath)) {
                return false;
            }
            lengthMap[template] = fs.readdirSync(templatePath)
                .filter((file: string) => file.match(/\d\.png/))
                .length;

            const templateData: TemplateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            aliasMap[template] = templateData.alias ?? [];
            typeMap[template] = templateData.type ?? "Unknown";
            return true;
        });

    const fontList: string[] = fs.readdirSync(fontsPath)
        .filter((font: string) => font.match(/.+\.(woff|eot|woff2|ttf)/))

    return {
        [path.join(basePath, 'index.json')]: JSON.stringify({
            version: config.oldTargetVersion,
            dataPath: config.path,
            dataList: oldTemplatesList,
            fontList: fontList
        }, null, 2),
        [path.join(basePath, 'index.map.json')]: JSON.stringify({
            length: lengthMap,
            alias: aliasMap,
            type: typeMap
        }, null, 2)
    }
}

import fs from 'fs';
import path from 'path';
import {Config} from './types';
import {getFontInfo} from './fonts-info';
import {filesMd5, md5} from "./utils";

const SCRIPT_NAME = 'main.js'
const TEMPLATE_NAME = 'template.json'
const OLD_TEMPLATE_NAME = 'data.json'

const runtimeInfo = {
    version: 101,
    scriptApiVersion: 100,
    platform: 'jvm',
    jsEngine: 'nashorn',
    drawingApi: 'awt',
    features: ['http-server', 'qq-bot']
}

const rootDir: string = process.cwd()

export async function buildTemplateIndex(config: Config): Promise<Record<string, string>> {
    const basePath: string = path.join(rootDir, config.basePath);
    const templatePath: string = path.join(basePath, config.path);
    const fontsPath: string = path.join(basePath, config.fontsPath);

    // init fonts
    const fontNameMap = new Map<string, string>()
    const resultFontObj = {} as Record<string, Record<string, any>>
    const fonts = fs.readdirSync(fontsPath)
        .filter(font => font.match(/.+\.(woff|eot|woff2|ttf)/))
        .map(async font => {
            const fontPath = path.join(fontsPath, font)
            const fontContent = fs.readFileSync(fontPath)
            const info = await getFontInfo(fontPath)
            info.name.forEach(n => fontNameMap.set(n, font))
            resultFontObj[font] = {
                md5: await md5(fontPath),
                size: fontContent.length,
                ...info
            }
        });

    await Promise.all(fonts)

    return Promise.all(fs.readdirSync(templatePath)
        .map(async id => {
            const info = fs.statSync(path.join(templatePath, id))
            if (info.isFile()) {
                return null
            }
            // script
            if (fs.existsSync(path.join(templatePath, id, SCRIPT_NAME))) {
                const scriptContent = fs.readFileSync(path.join(templatePath, id, SCRIPT_NAME), "utf-8")

                let metadata

                // @ts-ignore
                function register(callback) {
                    metadata = callback(runtimeInfo)
                }

                const on = () => {
                }
                const generate = () => {
                }
                eval(`(function (register) {
                    ${scriptContent}
                })(register);`);
                if (!metadata) {
                    return null
                }

                return {
                    type: 'script',
                    id,
                    metadata,
                    ...await filesMd5(path.join(templatePath, id))
                }
            }

            // template
            if (fs.existsSync(path.join(templatePath, id, TEMPLATE_NAME))) {
                const template = require(path.join(templatePath, id, TEMPLATE_NAME))
                const res = {
                    type: 'template',
                    id,
                    metadata: template.metadata,
                    ...await filesMd5(path.join(templatePath, id))
                } as any
                const dependentFonts = searchTemplateDependencyFont(fontNameMap, template)
                if (dependentFonts.length) {
                    res.dependentFonts = dependentFonts
                }
                return res
            }

            // old template
            if (fs.existsSync(path.join(templatePath, id, OLD_TEMPLATE_NAME))) {
                const template = require(path.join(templatePath, id, OLD_TEMPLATE_NAME))
                const res = {
                    type: 'template',
                    id,
                    metadata: {
                        apiVersion: 0,
                        alias: template.alias,
                        inRandomList: template.inRandomList,
                        hidden: template.hidden,
                    },
                    ...await filesMd5(path.join(templatePath, id))
                } as any
                const dependentFonts = searchOldTemplateDependencyFont(fontNameMap, template)
                if (dependentFonts.length) {
                    res.dependentFonts = dependentFonts
                }
                return res
            }
        })
    ).then(templatesList => {
        templatesList = templatesList.filter(Boolean)
        const map = {}
        for (const template of templatesList) {
            map[template!!.id] = template
            // @ts-ignore
            delete template!!.id
        }
        return {
            templatesPath: config.path,
            templates: map
        }
    }).then(async result => {
        return {
            [path.join(basePath, 'petpet-index.json')]: JSON.stringify({
                ...result,
                // @ts-ignore
                fontsPath: config.fontsPath,
                fonts: resultFontObj
            }, null, 2)
        }
    })
}


function searchTemplateDependencyFont(fontMap: Map<string, string>, template) {
    return [...new Set(
        template.elements?.filter(e => e.type === 'text' && e.font)
            ?.map(e => fontMap.get(e.font.toLowerCase()))
    )]
}

function searchOldTemplateDependencyFont(fontMap: Map<string, string>, template) {
    return [...new Set(
        template.text?.filter(t => t.font)
            ?.map(t => fontMap.get(t.font.toLowerCase()))
    )]
}
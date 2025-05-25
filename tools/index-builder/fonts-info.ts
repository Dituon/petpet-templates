import fontkit, {Font} from 'fontkit'

export async function getFontInfo(path: string) {
    const font = await fontkit.open(path) as Font
    return {
        name: [...new Set([
            font.familyName, font.fullName, font.postscriptName, font.subfamilyName
        ].map(n => n.toLowerCase()))]
    }
}
import crypto from "crypto";
import fs from "fs";
import path from "path";

export async function md5(filePath) {
    return new Promise((res, rej) => {
        const hash = crypto.createHash('md5');
        const rStream = fs.createReadStream(filePath);

        rStream.on('data', (data) => hash.update(data));
        rStream.on('end', () => res(hash.digest('hex')));
        rStream.on('error', (err) => rej(err)); // 处理文件读取错误
    });
}

export async function filesMd5(dirPath) {
    const result = {
        resource: {},
        size: 0
    }
    const files = await fs.promises.readdir(dirPath);

    await Promise.all(
        files.map(async (file) => {
            const fullPath = path.join(dirPath, file);
            const stat = await fs.promises.stat(fullPath);

            if (stat.isDirectory()) {
                const childHashes = await filesMd5(fullPath);
                result.size += childHashes.size
                for (const [name, hash] of Object.entries(childHashes.resource)) {
                    result.resource[file + '/' + name] = hash;
                }
            } else {
                result.resource[file] = await md5(fullPath);
                result.size += stat.size
            }
        })
    )

    return result;
}
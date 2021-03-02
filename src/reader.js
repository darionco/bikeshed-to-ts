async function readFileLines(filePath, lineCB) {
    const {DataFile} = await import('@dekkai/data-source');
    const file = await DataFile.fromLocalSource(filePath);

    // load 16KB chunks probably never
    const sizeOf16KB = 16 * 1024;
    const byteLength = await file.byteLength;
    const decoder = new TextDecoder();
    const lineBreak = '\n'.charCodeAt(0);

    for(let offset = 0; offset <= byteLength; offset += sizeOf16KB) {
        const chunkEnd = Math.min(offset + sizeOf16KB, byteLength);
        const chunk = await file.loadData(offset, chunkEnd);
        const view = new DataView(chunk);
        let start = 0;
        let count = 0;

        for (let i = 0, n = chunk.byteLength; i < n; ++i) {
            if (view.getUint8(i) === lineBreak || offset + i === byteLength) {
                const statementBuffer = new Uint8Array(chunk, start, i - start);
                start = i + 1;
                ++count;
                lineCB(decoder.decode(statementBuffer));
            }
        }

        if (start < chunk.byteLength) {
            offset -= chunk.byteLength - start;
        }
    }
}

module.exports = {
    readFileLines,
};

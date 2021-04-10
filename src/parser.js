const {readFileLines} = require('./reader.js');
const {matchEndDFN, matchEndIDL, matchStartDFN, matchStartIDL} = require('./regex.js');
const {parse: parseIDL} = require('webidl2');
const {convertIDL} = require('webidl2ts');

async function parseBikeShedFile(filePath) {
    const exposed = new Set();

    const dfnBlocks = new Map();
    const tsBlocks = new Map();

    let idlRecording = null;
    let dfnRecording = null;

    await readFileLines(filePath, line => {
        /* DNF Matching */
        const dfnMatch = matchStartDFN(line);
        if (dfnMatch) {
            dfnRecording = {
                target: dfnMatch[2],
                type: dfnMatch[1],
                lines: [],
            }
            return;
        }

        if (dfnRecording && matchEndDFN(line)) {
            if (!dfnBlocks.has(dfnRecording.target)) {
                dfnBlocks.set(dfnRecording.target, []);
            }
            dfnBlocks.get(dfnRecording.target).push(dfnRecording);
            dfnRecording = null;
            return;
        }

        if (dfnRecording) {
            dfnRecording.lines.push(line);
            return;
        }

        /* IDL Matching */
        if (matchStartIDL(line)) {
            idlRecording = [];
            return;
        }

        if (idlRecording && matchEndIDL(line)) {
            const idlText = idlRecording.join('\n');
            idlRecording = null;

            const idlBlock = parseIDL(idlText);
            for (const idlNode of idlBlock) {
                if (isExposed(idlNode)) {
                    exposed.add(idlNode.name);
                }
            }

            const tsNodes = convertIDL(idlBlock, {});
            for (let i = 0, n = tsNodes.length; i < n; ++i) {
                const node = tsNodes[i];
                if (node.name) {
                    node.__idl = [idlBlock[i]];
                    if (!tsBlocks.has(node.name.escapedText)) {
                        tsBlocks.set(node.name.escapedText, []);
                    }
                    tsBlocks.get(node.name.escapedText).push(node);
                }
            }
            return;
        }

        if (idlRecording) {
            idlRecording.push(line);
        }
    });

    return {
        dfn: dfnBlocks,
        ts: tsBlocks,
        exposed,
    };
}

function isExposed(idlNode) {
    if (idlNode.extAttrs.length) {
        for (const attr of idlNode.extAttrs) {
            if (attr.name === 'Exposed') {
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    parseBikeShedFile,
    isExposed,
};

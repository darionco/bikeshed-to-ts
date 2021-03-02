const {addLeadingComments} = require('./commenter.js');
const ts = require('typescript');
const {printTs: printTS} = require('webidl2ts');
const {parseBikeShedFile} = require('./parser.js');

function consolidateTypeTS(tsBlock) {
    const final = tsBlock[0];
    for (let i = 1, n = tsBlock.length; i < n; ++i) {
        const block = tsBlock[i];

        if (Array.isArray(block.heritageClauses) && block.heritageClauses.length) {
            if (!Array.isArray(final.heritageClauses)) {
                final.heritageClauses = block.heritageClauses;
            } else {
                final.heritageClauses[0].types.push(...block.heritageClauses[0].types);
            }
        }

        if (Array.isArray(block.members) && block.members.length) {
            if (!Array.isArray(final.members)) {
                final.members = block.members;
            } else {
                final.members.push(...block.members);
            }
        }
    }

    return final;
}

function addExportKeyword(node) {
    const mod = ts.factory.createToken(ts.SyntaxKind.ExportKeyword);
    if (node.modifiers) {
        node.modifiers.push(mod);
    } else {
        node.modifiers = [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)];
    }
}

function addGlobalNodesToLocalScope(local, global) {
    if (global.length) {
        local.push(ts.factory.createModuleDeclaration(
            /*decorators*/ undefined,
            /*modifiers*/ [ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
            ts.factory.createIdentifier('global'),
            ts.factory.createModuleBlock(global),
            ts.NodeFlags.GlobalAugmentation
        ));

        if (local.length === 1) {
            local.push(ts.factory.createExportDeclaration(
                null,
                null,
                false,
                ts.factory.createNamedExports([])
            ));
        }
    }
}

function assembleBlocks(blocks, forceGlobal) {
    const globalNodes = [];
    const localNodes = [];

    for (const [key, value] of blocks.ts) {
        const node = consolidateTypeTS(value);
        if (blocks.dfn.has(key)) {
            addLeadingComments(node, blocks.dfn.get(key));
        }

        addExportKeyword(node);

        if (forceGlobal || blocks.exposed.has(key)) {
            globalNodes.push(node);
        } else {
            localNodes.push(node);
        }
    }

    addGlobalNodesToLocalScope(localNodes, globalNodes);

    return printTS(localNodes);
}

async function assembleFile(filePath, forceGlobal) {
    const blocks = await parseBikeShedFile(filePath);
    return assembleBlocks(blocks, forceGlobal);
}

module.exports = {
    consolidateTypeTS,
    addExportKeyword,
    addGlobalNodesToLocalScope,
    assembleBlocks,
    assembleFile,
};

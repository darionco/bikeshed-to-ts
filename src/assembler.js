const {addLeadingComments} = require('./commenter.js');
const ts = require('typescript');
const {printTs: printTS} = require('webidl2ts');
const {parseBikeShedFile} = require('./parser.js');

function consolidateTypeTS(tsBlock) {
    const final = tsBlock[0];
    for (let i = 1, n = tsBlock.length; i < n; ++i) {
        const block = tsBlock[i];
        final.__idl.push(block.__idl);
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

function addNominalIdentifier(node) {
    if (!node.members) {
        node.members = [];
    }

    const __brand = ts.factory.createPropertyDeclaration(
        /*decorators*/ undefined,
        /*modifiers*/ [ts.factory.createToken(ts.SyntaxKind.ReadonlyKeyword)],
        '__brand',
        undefined,
        ts.factory.createStringLiteral(node.name.escapedText, true),
        undefined
    );

    const comment =
        '*\n ' +
        ' * Nominal type branding.\n ' +
        ' * https://github.com/microsoft/TypeScript/pull/33038\n ' +
        ' * @internal\n ';
    ts.addSyntheticLeadingComment(__brand, ts.SyntaxKind.MultiLineCommentTrivia, comment, true);

    node.members.unshift(__brand);
}

function isIDLType(block, type) {
    for (const idl of block) {
        if (idl.type === type) {
            return true;
        }
    }
    return false;
}

function processNominalTypes(nodes) {
    const inherited = new Set();
    for (const node of nodes) {
        if (node.heritageClauses) {
            for (const { types } of node.heritageClauses) {
                for (const type of types) {
                    inherited.add(type.expression.escapedText);
                }
            }
        }
    }

    for (const node of nodes) {
        if (isIDLType(node.__idl, 'interface') && !inherited.has(node.name.escapedText)) {
            addNominalIdentifier(node);
        }
    }
}

function assembleNodes(local, global) {
    const ret = [...local];
    if (global.length) {
        ret.push(ts.factory.createModuleDeclaration(
            /*decorators*/ undefined,
            /*modifiers*/ [ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
            ts.factory.createIdentifier('global'),
            ts.factory.createModuleBlock(global),
            ts.NodeFlags.GlobalAugmentation
        ));

        if (ret.length === 1) {
            ret.push(ts.factory.createExportDeclaration(
                null,
                null,
                false,
                ts.factory.createNamedExports([])
            ));
        }
    }
    return ret;
}

function assembleBlocks(blocks, forceGlobal, safeNominalTypes = false) {
    const globalNodes = [];
    const localNodes = [];

    for (const [key, value] of blocks.ts) {
        const node = consolidateTypeTS(value);
        if (blocks.dfn.has(key)) {
            addLeadingComments(node, blocks.dfn.get(key));
        }

        if (forceGlobal || blocks.exposed.has(key)) {
            globalNodes.push(node);
        } else {
            addExportKeyword(node);
            localNodes.push(node);
        }
    }

    if (safeNominalTypes) {
        processNominalTypes(localNodes);
        processNominalTypes(globalNodes);
    }

    return assembleNodes(localNodes, globalNodes);
}

async function assembleFile(filePath, forceGlobal, safeNominalTypes) {
    const blocks = await parseBikeShedFile(filePath);
    const nodes = assembleBlocks(blocks, forceGlobal, safeNominalTypes);
    return printTS(nodes);
}

module.exports = {
    consolidateTypeTS,
    addExportKeyword,
    assembleNodes,
    assembleBlocks,
    assembleFile,
};

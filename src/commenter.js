const {
    cleanString,
    matchAttributeExp,
    matchCommentExp, matchMethodArgumentExp,
    matchMethodExp,
    matchXMLBlockEndExp,
    matchXMLBlockStartExp
} = require('./regex.js');
const ts = require('typescript');

function makeXMLBlock(matchResult) {
    return {
        tag: matchResult[1],
        typeAttr: matchResult[4] && matchResult[4] !== 'for' ? matchResult[4] : matchResult[2],
        typeVal: matchResult[4] && matchResult[4] !== 'for' ? matchResult[5] : matchResult[3],
        target: matchResult[2] && matchResult[2] === 'for' ? matchResult[3] : matchResult[5],
    }
}

function processMethodComment(definition) {
    const blocks = [];
    let currentBlock = null;
    let comment = '* \n ';
    for (const line of definition.lines) {
        const trimmed = matchCommentExp(line);
        if (trimmed && trimmed[1] !== '::') {
            const xmlBlockStart = matchXMLBlockStartExp(trimmed[1]);
            if (xmlBlockStart) {
                currentBlock = makeXMLBlock(xmlBlockStart);
                blocks.push(currentBlock);
                continue;
            }

            const xmlBlockEnd = matchXMLBlockEndExp(trimmed[1]);
            if (xmlBlockEnd) {
                if (blocks.length && blocks[blocks.length - 1].tag === xmlBlockEnd[1]) {
                    blocks.pop();
                    currentBlock = blocks.length ? blocks[blocks.length - 1] : null;
                }
                continue;
            }

            if (!currentBlock) {
                comment += `* ${cleanString(trimmed[1])}\n `;
            } else if (currentBlock.typeVal === 'argumentdef') {
                const argument = matchMethodArgumentExp(trimmed[1]);
                if (argument) {
                    comment += `* @param ${cleanString(argument[1])} - ${cleanString(argument[2])}\n `;
                } else {
                    comment += `* \t${cleanString(trimmed[1])}\n `;
                }
            }
        }
    }
    ts.addSyntheticLeadingComment(definition.member, ts.SyntaxKind.MultiLineCommentTrivia, comment, true);
}

function processAttributeComment(definition) {
    let comment = '* \n ';
    for (const line of definition.lines) {
        const trimmed = matchCommentExp(line);
        if (trimmed && trimmed[1] !== '::') {
            comment += `* ${cleanString(trimmed[1])}\n `;
        }
    }
    ts.addSyntheticLeadingComment(definition.member, ts.SyntaxKind.MultiLineCommentTrivia, comment, true);
}

function processComment(comment) {
    if (comment.type === 'attribute' || comment.type === 'dict-member') {
        processAttributeComment(comment);
    } else if (comment.type === 'method') {
        processMethodComment(comment);
    }
}

function addLeadingComments(target, dfnBlocks) {
    const memberSet = new Set(); // for overloaded functions
    const comments = [];
    for (const block of dfnBlocks) {
        if (block.type === 'method' || block.type === 'attribute' || block.type === 'dict-member') {
            const matcher = block.type === 'method' ? matchMethodExp : matchAttributeExp;
            let commentDefinition = null;
            for (const line of block.lines) {
                const memberName = matcher(line);
                if (memberName) {
                    const member = target.members.find(m => m.name.escapedText === memberName[1] && !memberSet.has(m));
                    if (member) {
                        commentDefinition = {
                            member,
                            type: block.type,
                            lines: [],
                        };
                        comments.push(commentDefinition);
                        memberSet.add(member);
                    }
                } else if (commentDefinition) {
                    commentDefinition.lines.push(line);
                }
            }
        } else {
            console.log(`UNRECOGNIZED DFN BLOCK TYPE: ${block.type} [${block.target}]`);
        }
    }

    for (const comment of comments) {
        processComment(comment);
    }
}

module.exports = {
    makeXMLBlock,
    processMethodComment,
    processAttributeComment,
    processComment,
    addLeadingComments,
};

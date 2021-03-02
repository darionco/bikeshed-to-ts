const kIDLStartExp = /<script\s+.*type=['"]?idl/;
const kIDLStopExp = /<\/\s*script>/;
const kDFNStartExp = /<dl\s+dfn-type\s*=\s*["']?([^\s"']+)["']?\s+dfn-for\s*=\s*["']?([^\s"']+)["']?\s*>/;
const kDFNStopExp = /<\/\s*dl>/;

const kDFNMethodExp = /^\s*:\s*<dfn>\s*(\S+)\(/;
const kDFNAttributeExp = /^\s*:\s*<dfn>\s*(\S+)\s*<\/dfn>/;
const kDFNCommentExp = /^\s*(?:::)?\s*(.+)\s*$/;
const kDFNMethodArgument = /\|?([^\s|]+)\|?:\s*(.+)/;

// we only care about a specific subset of tags
const kXMLBlockStartExp = /<\s*(\S+)\s+(?:(\S+)=\s*["']?([^"']+)["']?)(?:\s+(\S+)=\s*["']?([^"']+)["']?)?\s*>/;
const kXMLBlockEndExp = /<\/\s*(\S+)\s*>/;

const kCleanAutolinkExp = /(?:\[=|=])/g;
const kCleanParamPropertyRef = /\|(\S+)\|\.{{(?:\S+\/)+\[\[(\S+)]]}}/g;
const kCleanParamRef = /\|(\S+)\|/g
const kCleanFunctionLink = /{{(.+)\(\)}}/g;
const kCleanLinkProperties = /[\/](?=[^\s}]+}})/g;
const kCleanLink = /{{([^\s{}]+)}}/g;

function matchStartDFN(str) {
    return str.match(kDFNStartExp);
}

function matchEndDFN(str) {
    return str.match(kDFNStopExp);
}

function matchStartIDL(str) {
    return str.match(kIDLStartExp);
}

function matchEndIDL(str) {
    return str.match(kIDLStopExp);
}

function matchMethodExp(str) {
    return str.match(kDFNMethodExp);
}

function matchMethodArgumentExp(str) {
    return str.match(kDFNMethodArgument);
}

function matchAttributeExp(str) {
    return str.match(kDFNAttributeExp);
}

function matchCommentExp(str) {
    return str.match(kDFNCommentExp);
}

function matchXMLBlockStartExp(str) {
    return str.match(kXMLBlockStartExp);
}

function matchXMLBlockEndExp(str) {
    return str.match(kXMLBlockEndExp);
}

function cleanString(str) {
    // they must run in this order
    let ret = str;
    ret = ret.replace(kCleanParamPropertyRef, '`$1.$2`');
    ret = ret.replace(kCleanParamRef, '`$1`');
    ret = ret.replace(kCleanFunctionLink, '{{$1}}');
    ret = ret.replace(kCleanAutolinkExp, '');
    ret = ret.replace(kCleanLinkProperties, '#');
    ret = ret.replace(kCleanLink, '{@link $1}');

    return ret;
}

module.exports = {
    matchStartDFN,
    matchEndDFN,
    matchStartIDL,
    matchEndIDL,
    matchMethodExp,
    matchMethodArgumentExp,
    matchAttributeExp,
    matchCommentExp,
    matchXMLBlockStartExp,
    matchXMLBlockEndExp,
    cleanString,
};

import { c as createScopedLogger } from "./index-C177jscz.js";
const nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
const nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
const nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
const regexName = new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}
const isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === "undefined");
};
function isExist(v) {
  return typeof v !== "undefined";
}
const defaultOptions$1 = {
  allowBooleanAttributes: false,
  //A tag can have attributes without any value
  unpairedTags: []
};
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions$1, options);
  const tags = [];
  let tagFound = false;
  let reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    xmlData = xmlData.substr(1);
  }
  for (let i = 0; i < xmlData.length; i++) {
    if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err) return i;
    } else if (xmlData[i] === "<") {
      let tagStartPos = i;
      i++;
      if (xmlData[i] === "!") {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === "/") {
          closingTag = true;
          i++;
        }
        let tagName = "";
        for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        if (tagName[tagName.length - 1] === "/") {
          tagName = tagName.substring(0, tagName.length - 1);
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
        }
        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === "/") {
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
          } else {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject(
                "InvalidTag",
                "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                getLineNumberForPosition(xmlData, tagStartPos)
              );
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }
          if (reachedRoot === true) {
            return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
          } else if (options.unpairedTags.indexOf(tagName) !== -1) ;
          else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            if (xmlData[i + 1] === "!") {
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === "?") {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else {
              break;
            }
          } else if (xmlData[i] === "&") {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        }
        if (xmlData[i] === "<") {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  }
  return true;
}
function isWhiteSpace(char) {
  return char === " " || char === "	" || char === "\n" || char === "\r";
}
function readPI(xmlData, i) {
  const start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == "?" || xmlData[i] == " ") {
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === "xml") {
        return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        angleBracketsCount++;
      } else if (xmlData[i] === ">") {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  }
  return i;
}
const doubleQuote = '"';
const singleQuote = "'";
function readAttributeStr(xmlData, i) {
  let attrStr = "";
  let startChar = "";
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === "") {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) ;
      else {
        startChar = "";
      }
    } else if (xmlData[i] === ">") {
      if (startChar === "") {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== "") {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed
  };
}
const validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
      return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === "x") {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ";")
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";")
    return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ";")
      break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return isName(attrName);
}
function validateTagName(tagname) {
  return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}
const defaultOptions = {
  preserveOrder: false,
  attributeNamePrefix: "@_",
  attributesGroupName: false,
  textNodeName: "#text",
  ignoreAttributes: true,
  removeNSPrefix: false,
  // remove NS from tag name or attribute name if true
  allowBooleanAttributes: false,
  //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  //Trim string values of tag and attributes
  cdataPropName: false,
  numberParseOptions: {
    hex: true,
    leadingZeros: true,
    eNotation: true
  },
  tagValueProcessor: function(tagName, val) {
    return val;
  },
  attributeValueProcessor: function(attrName, val) {
    return val;
  },
  stopNodes: [],
  //nested tags will not be parsed even for errors
  alwaysCreateTextNode: false,
  isArray: () => false,
  commentPropName: false,
  unpairedTags: [],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: false,
  transformAttributeName: false,
  updateTag: function(tagName, jPath, attrs) {
    return tagName;
  },
  // skipEmptyListItem: false
  captureMetaData: false
};
const buildOptions = function(options) {
  return Object.assign({}, defaultOptions, options);
};
let METADATA_SYMBOL$1;
if (typeof Symbol !== "function") {
  METADATA_SYMBOL$1 = "@@xmlMetadata";
} else {
  METADATA_SYMBOL$1 = Symbol("XML Node Metadata");
}
class XmlNode {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = [];
    this[":@"] = {};
  }
  add(key, val) {
    if (key === "__proto__") key = "#__proto__";
    this.child.push({ [key]: val });
  }
  addChild(node, startIndex) {
    if (node.tagname === "__proto__") node.tagname = "#__proto__";
    if (node[":@"] && Object.keys(node[":@"]).length > 0) {
      this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
    } else {
      this.child.push({ [node.tagname]: node.child });
    }
    if (startIndex !== void 0) {
      this.child[this.child.length - 1][METADATA_SYMBOL$1] = { startIndex };
    }
  }
  /** symbol used for metadata */
  static getMetaDataSymbol() {
    return METADATA_SYMBOL$1;
  }
}
function readDocType(xmlData, i) {
  const entities = {};
  if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
    i = i + 9;
    let angleBracketsCount = 1;
    let hasBody = false, comment = false;
    let exp = "";
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === "<" && !comment) {
        if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
          i += 7;
          let entityName, val;
          [entityName, val, i] = readEntityExp(xmlData, i + 1);
          if (val.indexOf("&") === -1)
            entities[entityName] = {
              regx: RegExp(`&${entityName};`, "g"),
              val
            };
        } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
          i += 8;
          const { index } = readElementExp(xmlData, i + 1);
          i = index;
        } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
          i += 8;
        } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
          i += 9;
          const { index } = readNotationExp(xmlData, i + 1);
          i = index;
        } else if (hasSeq(xmlData, "!--", i)) comment = true;
        else throw new Error(`Invalid DOCTYPE`);
        angleBracketsCount++;
        exp = "";
      } else if (xmlData[i] === ">") {
        if (comment) {
          if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
            comment = false;
            angleBracketsCount--;
          }
        } else {
          angleBracketsCount--;
        }
        if (angleBracketsCount === 0) {
          break;
        }
      } else if (xmlData[i] === "[") {
        hasBody = true;
      } else {
        exp += xmlData[i];
      }
    }
    if (angleBracketsCount !== 0) {
      throw new Error(`Unclosed DOCTYPE`);
    }
  } else {
    throw new Error(`Invalid Tag instead of DOCTYPE`);
  }
  return { entities, i };
}
const skipWhitespace = (data, index) => {
  while (index < data.length && /\s/.test(data[index])) {
    index++;
  }
  return index;
};
function readEntityExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let entityName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
    entityName += xmlData[i];
    i++;
  }
  validateEntityName(entityName);
  i = skipWhitespace(xmlData, i);
  if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
    throw new Error("External entities are not supported");
  } else if (xmlData[i] === "%") {
    throw new Error("Parameter entities are not supported");
  }
  let entityValue = "";
  [i, entityValue] = readIdentifierVal(xmlData, i, "entity");
  i--;
  return [entityName, entityValue, i];
}
function readNotationExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let notationName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    notationName += xmlData[i];
    i++;
  }
  validateEntityName(notationName);
  i = skipWhitespace(xmlData, i);
  const identifierType = xmlData.substring(i, i + 6).toUpperCase();
  if (identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
    throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
  }
  i += identifierType.length;
  i = skipWhitespace(xmlData, i);
  let publicIdentifier = null;
  let systemIdentifier = null;
  if (identifierType === "PUBLIC") {
    [i, publicIdentifier] = readIdentifierVal(xmlData, i, "publicIdentifier");
    i = skipWhitespace(xmlData, i);
    if (xmlData[i] === '"' || xmlData[i] === "'") {
      [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    }
  } else if (identifierType === "SYSTEM") {
    [i, systemIdentifier] = readIdentifierVal(xmlData, i, "systemIdentifier");
    if (!systemIdentifier) {
      throw new Error("Missing mandatory system identifier for SYSTEM notation");
    }
  }
  return { notationName, publicIdentifier, systemIdentifier, index: --i };
}
function readIdentifierVal(xmlData, i, type) {
  let identifierVal = "";
  const startChar = xmlData[i];
  if (startChar !== '"' && startChar !== "'") {
    throw new Error(`Expected quoted string, found "${startChar}"`);
  }
  i++;
  while (i < xmlData.length && xmlData[i] !== startChar) {
    identifierVal += xmlData[i];
    i++;
  }
  if (xmlData[i] !== startChar) {
    throw new Error(`Unterminated ${type} value`);
  }
  i++;
  return [i, identifierVal];
}
function readElementExp(xmlData, i) {
  i = skipWhitespace(xmlData, i);
  let elementName = "";
  while (i < xmlData.length && !/\s/.test(xmlData[i])) {
    elementName += xmlData[i];
    i++;
  }
  if (!validateEntityName(elementName)) {
    throw new Error(`Invalid element name: "${elementName}"`);
  }
  i = skipWhitespace(xmlData, i);
  let contentModel = "";
  if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) i += 4;
  else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) i += 2;
  else if (xmlData[i] === "(") {
    i++;
    while (i < xmlData.length && xmlData[i] !== ")") {
      contentModel += xmlData[i];
      i++;
    }
    if (xmlData[i] !== ")") {
      throw new Error("Unterminated content model");
    }
  } else {
    throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
  }
  return {
    elementName,
    contentModel: contentModel.trim(),
    index: i
  };
}
function hasSeq(data, seq, i) {
  for (let j = 0; j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1]) return false;
  }
  return true;
}
function validateEntityName(name) {
  if (isName(name))
    return name;
  else
    throw new Error(`Invalid entity name ${name}`);
}
const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
const consider = {
  hex: true,
  // oct: false,
  leadingZeros: true,
  decimalPoint: ".",
  eNotation: true
  //skipLike: /regex/
};
function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string") return str;
  let trimmedStr = str.trim();
  if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
  else if (str === "0") return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
  } else if (trimmedStr.search(/.+[eE].+/) !== -1) {
    return resolveEnotation(str, trimmedStr, options);
  } else {
    const match = numRegex.exec(trimmedStr);
    if (match) {
      const sign = match[1] || "";
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]);
      const decimalAdjacentToLeadingZeros = sign ? (
        // 0., -00., 000.
        str[leadingZeros.length + 1] === "."
      ) : str[leadingZeros.length] === ".";
      if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
        return str;
      } else {
        const num = Number(trimmedStr);
        const parsedStr = String(num);
        if (num === 0) return num;
        if (parsedStr.search(/[eE]/) !== -1) {
          if (options.eNotation) return num;
          else return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          if (parsedStr === "0") return num;
          else if (parsedStr === numTrimmedByZeros) return num;
          else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
          else return str;
        }
        let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
        if (leadingZeros) {
          return n === parsedStr || sign + n === parsedStr ? num : str;
        } else {
          return n === parsedStr || n === sign + parsedStr ? num : str;
        }
      }
    } else {
      return str;
    }
  }
}
const eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation) return str;
  const notation = trimmedStr.match(eNotationRegx);
  if (notation) {
    let sign = notation[1] || "";
    const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
    const leadingZeros = notation[2];
    const eAdjacentToLeadingZeros = sign ? (
      // 0E.
      str[leadingZeros.length + 1] === eChar
    ) : str[leadingZeros.length] === eChar;
    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
    else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
      return Number(trimmedStr);
    } else if (options.leadingZeros && !eAdjacentToLeadingZeros) {
      trimmedStr = (notation[1] || "") + notation[3];
      return Number(trimmedStr);
    } else return str;
  } else {
    return str;
  }
}
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    numStr = numStr.replace(/0+$/, "");
    if (numStr === ".") numStr = "0";
    else if (numStr[0] === ".") numStr = "0" + numStr;
    else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  if (parseInt) return parseInt(numStr, base);
  else if (Number.parseInt) return Number.parseInt(numStr, base);
  else if (window && window.parseInt) return window.parseInt(numStr, base);
  else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}
function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}
class OrderedObjParser {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
      "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
      "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
      "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      "space": { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      "cent": { regex: /&(cent|#162);/g, val: "¢" },
      "pound": { regex: /&(pound|#163);/g, val: "£" },
      "yen": { regex: /&(yen|#165);/g, val: "¥" },
      "euro": { regex: /&(euro|#8364);/g, val: "€" },
      "copyright": { regex: /&(copy|#169);/g, val: "©" },
      "reg": { regex: /&(reg|#174);/g, val: "®" },
      "inr": { regex: /&(inr|#8377);/g, val: "₹" },
      "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) }
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
  }
}
function addExternalEntities(externalEntities) {
  const entKeys = Object.keys(externalEntities);
  for (let i = 0; i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
      regex: new RegExp("&" + ent + ";", "g"),
      val: externalEntities[ent]
    };
  }
}
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== void 0) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities) val = this.replaceEntitiesValue(val);
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if (newval === null || newval === void 0) {
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        return newval;
      } else if (this.options.trimValues) {
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          return val;
        }
      }
    }
  }
}
function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(":");
    const prefix = tagname.charAt(0) === "/" ? "/" : "";
    if (tags[0] === "xmlns") {
      return "";
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
const attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length;
    const attrs = {};
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue;
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if (aName === "__proto__") aName = "#__proto__";
        if (oldVal !== void 0) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if (newVal === null || newVal === void 0) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(
              oldVal,
              this.options.parseAttributeValue,
              this.options.numberParseOptions
            );
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
const parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, "\n");
  const xmlObj = new XmlNode("!xml");
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for (let i = 0; i < xmlData.length; i++) {
    const ch = xmlData[i];
    if (ch === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (this.options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode) {
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }
        const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
        if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0;
        if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
          propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
          this.tagsNodeStack.pop();
        } else {
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);
        currentNode = this.tagsNodeStack.pop();
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        let tagData = readTagExp(xmlData, i, false, "?>");
        if (!tagData) throw new Error("Pi Tag is not closed.");
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) ;
        else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath, i);
        }
        i = tagData.closeIndex + 1;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
          currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
        }
        i = endIndex;
      } else if (xmlData.substr(i + 1, 2) === "!D") {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if (val == void 0) val = "";
        if (this.options.cdataPropName) {
          currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
        } else {
          currentNode.add(this.options.textNodeName, val);
        }
        i = closeIndex + 2;
      } else {
        let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode && textData) {
          if (currentNode.tagname !== "!xml") {
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }
        const lastTag = currentNode;
        if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if (tagName !== xmlObj.tagname) {
          jPath += jPath ? "." + tagName : tagName;
        }
        const startIndex = i;
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            i = result.closeIndex;
          } else {
            const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result2.i;
            tagContent = result2.tagContent;
          }
          const childNode = new XmlNode(tagName);
          if (tagName !== tagExp && attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if (tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          this.addChild(currentNode, childNode, jPath, startIndex);
        } else {
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            const childNode = new XmlNode(tagName);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          } else {
            const childNode = new XmlNode(tagName);
            this.tagsNodeStack.push(currentNode);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};
function addChild(currentNode, childNode, jPath, startIndex) {
  if (!this.options.captureMetaData) startIndex = void 0;
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
  if (result === false) ;
  else if (typeof result === "string") {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}
const replaceEntitiesValue = function(val) {
  if (this.options.processEntities) {
    for (let entityName in this.docTypeEntities) {
      const entity = this.docTypeEntities[entityName];
      val = val.replace(entity.regx, entity.val);
    }
    for (let entityName in this.lastEntities) {
      const entity = this.lastEntities[entityName];
      val = val.replace(entity.regex, entity.val);
    }
    if (this.options.htmlEntities) {
      for (let entityName in this.htmlEntities) {
        const entity = this.htmlEntities[entityName];
        val = val.replace(entity.regex, entity.val);
      }
    }
    val = val.replace(this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) {
    if (isLeafNode === void 0) isLeafNode = currentNode.child.length === 0;
    textData = this.parseTextData(
      textData,
      currentNode.tagname,
      jPath,
      false,
      currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
      isLeafNode
    );
    if (textData !== void 0 && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}
function isItStopNode(stopNodes, jPath, currentTagName) {
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if (allNodesExp === stopNodeExp || jPath === stopNodeExp) return true;
  }
  return false;
}
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
  let attrBoundary;
  let tagExp = "";
  for (let index = i; index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
      if (ch === attrBoundary) attrBoundary = "";
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if (closingChar[1]) {
        if (xmlData[index + 1] === closingChar[1]) {
          return {
            data: tagExp,
            index
          };
        }
      } else {
        return {
          data: tagExp,
          index
        };
      }
    } else if (ch === "	") {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }
  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(":");
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }
  return {
    tagName,
    tagExp,
    closeIndex,
    attrExpPresent,
    rawTagName
  };
}
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  let openTagCount = 1;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex
            };
          }
        }
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, ">");
        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  }
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === "string") {
    const newval = val.trim();
    if (newval === "true") return true;
    else if (newval === "false") return false;
    else return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return "";
    }
  }
}
const METADATA_SYMBOL = XmlNode.getMetaDataSymbol();
function prettify(node, options) {
  return compress(node, options);
}
function compress(arr, options, jPath) {
  let text;
  const compressedObj = {};
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if (jPath === void 0) newJpath = property;
    else newJpath = jPath + "." + property;
    if (property === options.textNodeName) {
      if (text === void 0) text = tagObj[property];
      else text += "" + tagObj[property];
    } else if (property === void 0) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[METADATA_SYMBOL] !== void 0) {
        val[METADATA_SYMBOL] = tagObj[METADATA_SYMBOL];
      }
      if (tagObj[":@"]) {
        assignAttributes(val, tagObj[":@"], newJpath, options);
      } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
        else val = "";
      }
      if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        if (options.isArray(property, newJpath, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }
    }
  }
  if (typeof text === "string") {
    if (text.length > 0) compressedObj[options.textNodeName] = text;
  } else if (text !== void 0) compressedObj[options.textNodeName] = text;
  return compressedObj;
}
function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== ":@") return key;
  }
}
function assignAttributes(obj, attrMap, jpath, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length;
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}
function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  if (propCount === 0) {
    return true;
  }
  if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
    return true;
  }
  return false;
}
class XMLParser {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  /**
   * Parse XML dats to JS object 
   * @param {string|Buffer} xmlData 
   * @param {boolean|Object} validationOption 
   */
  parse(xmlData, validationOption) {
    if (typeof xmlData === "string") ;
    else if (xmlData.toString) {
      xmlData = xmlData.toString();
    } else {
      throw new Error("XML data is accepted in String or Bytes[] form.");
    }
    if (validationOption) {
      if (validationOption === true) validationOption = {};
      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.addExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
    else return prettify(orderedResult, this.options);
  }
  /**
   * Add Entity which is not by default supported by this library
   * @param {string} key 
   * @param {string} value 
   */
  addEntity(key, value) {
    if (value.indexOf("&") !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    } else if (value === "&") {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }
  /**
   * Returns a Symbol that can be used to access the metadata
   * property on a node.
   * 
   * If Symbol is not available in the environment, an ordinary property is used
   * and the name of the property is here returned.
   * 
   * The XMLMetaData property is only present when `captureMetaData`
   * is true in the options.
   */
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
}
class MultiXMLParser {
  xmlText;
  options;
  logger = createScopedLogger("MultiXMLParser");
  constructor(xmlText, options = {}) {
    this.xmlText = xmlText;
    this.options = {
      debug: false,
      preferFastXMLParser: false,
      fastXMLParserOptions: {
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        ignoreNameSpace: true,
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: true
      },
      ...options
    };
    if (this.options.debug) {
      this.logger.debug("MultiXMLParser starting", {
        xmlLength: xmlText.length,
        firstChars: xmlText.substring(0, 500),
        preferFastXMLParser: this.options.preferFastXMLParser
      });
    }
  }
  /**
   * Detect the current JavaScript environment
   */
  detectEnvironment() {
    if (typeof self !== "undefined" && typeof self.importScripts === "function" && typeof window === "undefined") {
      return "web-worker";
    }
    if (typeof window !== "undefined") {
      return "main-thread";
    }
    return "node";
  }
  /**
   * Parse the XML text using the best available strategy
   */
  async parse() {
    if (this.options.debug) {
      this.logger.debug("Starting XML parsing with multi-strategy approach");
    }
    const environment = this.detectEnvironment();
    if (this.options.debug) {
      this.logger.debug(`Detected environment: ${environment}`);
    }
    try {
      if (environment === "main-thread" && typeof DOMParser !== "undefined") {
        try {
          return await this.parseWithDOMParser();
        } catch (error) {
          this.logger.error("DOMParser failed in main browser thread.", { error: error instanceof Error ? error.message : String(error) });
          throw new Error("DOMParser failed in main browser thread. This is required for consistent LMF parsing.");
        }
      }
      if ((environment === "web-worker" || environment === "node") && this.isFastXMLParserAvailable()) {
        try {
          return await this.parseWithFastXMLParser();
        } catch (error) {
          this.logger.warn("fast-xml-parser failed, trying other strategies", { error: error instanceof Error ? error.message : String(error) });
        }
      }
      if (environment === "main-thread" && typeof DOMParser !== "undefined") {
        try {
          this.logger.info("Falling back to DOMParser in main-thread environment");
          return await this.parseWithDOMParser();
        } catch (error) {
          this.logger.warn("DOMParser fallback failed", { error: error instanceof Error ? error.message : String(error) });
        }
      } else if (this.isFastXMLParserAvailable()) {
        try {
          this.logger.info("Falling back to fast-xml-parser");
          return await this.parseWithFastXMLParser();
        } catch (error) {
          this.logger.warn("fast-xml-parser fallback failed", { error: error instanceof Error ? error.message : String(error) });
        }
      }
      if (typeof DOMParser !== "undefined") {
        try {
          this.logger.info("Final fallback to DOMParser");
          return await this.parseWithDOMParser();
        } catch (error) {
          this.logger.warn("Final DOMParser fallback failed", { error: error instanceof Error ? error.message : String(error) });
        }
      }
      this.logger.error(`No reliable XML parser available in ${environment} environment.`);
      throw new Error(`No reliable XML parser available in ${environment} environment. DOMParser (main thread) or fast-xml-parser (workers/Node.js) is required.`);
    } catch (error) {
      this.logger.error("All XML parsing strategies failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  /**
   * Check if fast-xml-parser is available
   */
  isFastXMLParserAvailable() {
    return true;
  }
  /**
   * Parse using fast-xml-parser (any JavaScript environment including web workers)
   */
  async parseWithFastXMLParser() {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        parseAttributeValue: false,
        // Disable for better performance
        parseTagValue: false,
        // Disable for better performance
        trimValues: false,
        // Disable for better performance
        allowBooleanAttributes: false,
        // Disable for better performance
        // Performance optimizations
        preserveOrder: false,
        processEntities: false,
        // Disable for better performance
        unpairedTags: [],
        // Empty array for better performance
        stopNodes: [],
        // Empty array for better performance
        // Note: validate option not available in fast-xml-parser v5
        // Memory optimizations
        removeNSPrefix: true,
        // Custom processors for better performance
        tagValueProcessor: (tagName, tagValue) => {
          return tagValue.length > 1e3 ? tagValue : tagValue.trim();
        },
        attributeValueProcessor: (attrName, attrValue) => {
          return attrValue;
        }
      });
      const result = parser.parse(this.xmlText);
      this.logger.debug("fast-xml-parser raw output sample", {
        rootKeys: Object.keys(result),
        firstRootKey: Object.keys(result)[0],
        firstRootStructure: result[Object.keys(result)[0]] ? {
          keys: Object.keys(result[Object.keys(result)[0]]),
          hasSynset: !!result[Object.keys(result)[0]].Synset,
          synsetType: typeof result[Object.keys(result)[0]].Synset,
          synsetKeys: result[Object.keys(result)[0]].Synset ? Object.keys(result[Object.keys(result)[0]].Synset) : []
        } : null
      });
      const converted = this.convertFastXMLParserOutput(result);
      return {
        ...converted,
        parserUsed: "fast-xml-parser"
      };
    } catch (error) {
      this.logger.warn("Fast XML parser failed, falling back to DOMParser:", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  /**
   * Convert fast-xml-parser output to our standard format
   */
  convertFastXMLParserOutput(parsedData) {
    const result = {};
    let elementCount = 0;
    const rootElements = [];
    const rootKey = Object.keys(parsedData).find(
      (key) => !key.startsWith("?") && !key.startsWith("@") && key !== "#text"
    );
    if (rootKey) {
      const rootData = parsedData[rootKey];
      rootElements.push(rootKey);
      if (typeof rootData === "object" && rootData !== null) {
        const convertedElement = this.convertFastXMLParserElement(rootKey, rootData);
        result[rootKey] = convertedElement;
        elementCount = this.countElements(convertedElement);
      }
    }
    return { data: result, elementCount, rootElements };
  }
  /**
   * Convert a fast-xml-parser element to our format
   */
  convertFastXMLParserElement(name, data, parent) {
    const attributes = {};
    const children = [];
    let text = "";
    Object.keys(data).forEach((key) => {
      if (key.startsWith("@_")) {
        const attrName = key.substring(2);
        attributes[attrName] = String(data[key]);
      }
    });
    if (data["#text"]) {
      text = String(data["#text"]);
    }
    if (!text) {
      Object.keys(data).forEach((key) => {
        if (key !== "#text" && !key.startsWith("@_") && typeof data[key] === "string") {
          const stringValue = data[key].trim();
          if (stringValue && !text) {
            text = stringValue;
            if (this.options.debug) {
              this.logger.debug(`Found text content in key '${key}': "${stringValue}"`);
            }
          }
        }
      });
    }
    Object.keys(data).forEach((key) => {
      if (!key.startsWith("@_") && key !== "#text") {
        if (typeof data[key] === "string") {
          const childElement = {
            name: key,
            attributes: {},
            children: [],
            text: data[key]
          };
          children.push(childElement);
        } else if (typeof data[key] === "object" && data[key] !== null) {
          if (Array.isArray(data[key])) {
            data[key].forEach((child) => {
              if (typeof child === "object" && child !== null) {
                const converted = this.convertFastXMLParserElement(key, child, void 0);
                children.push(converted);
              } else if (typeof child === "string") {
                const childElement = {
                  name: key,
                  attributes: {},
                  children: [],
                  text: child
                };
                children.push(childElement);
              }
            });
          } else {
            children.push(this.convertFastXMLParserElement(key, data[key], void 0));
          }
        }
      }
    });
    const element = { name, attributes, children, text };
    children.forEach((child) => {
      if (child.name !== "#text") {
        child.parent = element;
      }
    });
    return element;
  }
  /**
   * Count total elements in the parsed structure
   */
  countElements(element) {
    let count = 1;
    element.children.forEach((child) => {
      if (child.name !== "#text") {
        count += this.countElements(child);
      }
    });
    return count;
  }
  /**
   * Parse using native DOMParser (browser environment)
   */
  async parseWithDOMParser() {
    if (this.options.debug) {
      this.logger.debug("Parsing XML with DOMParser");
    }
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.xmlText, "text/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      const errorMsg = xmlDoc.getElementsByTagName("parsererror")[0]?.textContent || "Unknown parsing error";
      this.logger.error("XML parsing failed", { error: errorMsg });
      throw new Error(`XML parsing failed: ${errorMsg}`);
    }
    const result = {};
    let elementCount = 0;
    const rootElement = xmlDoc.documentElement;
    if (rootElement) {
      const elementName = rootElement.nodeName;
      if (elementName) {
        result[elementName] = this.processElement(rootElement);
        elementCount = this.countElements(result[elementName]);
      }
    }
    if (this.options.debug) {
      this.logger.debug("DOMParser parsing completed", { elementCount, rootElements: Object.keys(result) });
    }
    return {
      data: result,
      elementCount,
      rootElements: Object.keys(result),
      parserUsed: "DOMParser"
    };
  }
  /**
   * Process an XML element and its children recursively
   */
  processElement(element) {
    const name = element.nodeName;
    const attributes = {};
    const children = [];
    let text = "";
    if (this.options.debug) {
      this.logger.debug(`Processing element: ${name}`);
    }
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name && attr.value) {
        attributes[attr.name] = attr.value;
      }
    }
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent?.trim();
        if (textContent) {
          text += textContent;
          if (this.options.debug) {
            this.logger.debug(`Found text node: "${textContent}"`);
          }
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const processedChild = this.processElement(child);
        children.push(processedChild);
        if (this.options.debug) {
          this.logger.debug(`Processed child ${processedChild.name} with text: "${processedChild.text}"`);
        }
      }
    }
    if (!text && children.length > 0) {
      const childTexts = children.map((child) => child.text).filter((t) => t && t.trim()).join(" ");
      if (childTexts) {
        text = childTexts;
        if (this.options.debug) {
          this.logger.debug(`Collected text from children: "${text}"`);
        }
      }
    }
    if (!text && children.length === 1 && children[0].text) {
      text = children[0].text;
      if (this.options.debug) {
        this.logger.debug(`Using single child text for ${name}: "${text}"`);
      }
    }
    if (!text && typeof element.textContent === "string") {
      const tc = element.textContent.trim();
      if (tc) {
        text = tc;
        if (this.options.debug) {
          this.logger.debug(`Fallback to textContent for ${name}: "${text}"`);
        }
      }
    }
    if (this.options.debug) {
      this.logger.debug(`Final text for ${name}: "${text}"`);
    }
    return { name, attributes, children, text };
  }
  /**
   * Manual XML parsing fallback for environments without other parsers
   */
  async parseManually() {
    if (this.options.debug) {
      this.logger.debug("Using manual XML parser fallback");
    }
    if (!this.xmlText || this.xmlText.trim() === "") {
      throw new Error("Empty content received");
    }
    const result = {};
    let elementCount = 0;
    try {
      const rootMatch = this.xmlText.match(/<([a-zA-Z][a-zA-Z0-9_:]*)([^>]*)>/);
      if (rootMatch) {
        const rootTagName = rootMatch[1];
        const attrString = rootMatch[2];
        const attributes = this.parseAttributesManually(attrString);
        const { textContent, children } = this.extractContentAndChildren(rootTagName);
        result[rootTagName] = {
          name: rootTagName,
          attributes,
          children,
          text: textContent
        };
        try {
          this.logger.debug("Manual parser root element", { rootTagName, children: children.map((c) => c.name) });
        } catch {
        }
        elementCount = 1 + children.length;
      }
    } catch (error) {
      this.logger.error("Manual parsing failed", { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Manual parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (this.options.debug) {
      this.logger.debug("Manual parsing completed", { elementCount, rootElements: Object.keys(result) });
    }
    return {
      data: result,
      elementCount,
      rootElements: Object.keys(result),
      parserUsed: "manual"
    };
  }
  /**
   * Extract text content and children from XML content
   */
  extractContentAndChildren(rootTagName) {
    const children = [];
    let textContent = "";
    const closingTag = `</${rootTagName}>`;
    const closingPos = this.xmlText.indexOf(closingTag);
    if (closingPos === -1) {
      return { textContent: "", children: [] };
    }
    const openingTagEnd = this.xmlText.indexOf(">", this.xmlText.indexOf(`<${rootTagName}`)) + 1;
    const content = this.xmlText.substring(openingTagEnd, closingPos);
    const childRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)>([\s\S]*?)<\/\1>/g;
    let match;
    const consumedSpans = [];
    while ((match = childRegex.exec(content)) !== null) {
      const [full, childTagName, childAttrString, childInner] = match;
      const start = match.index;
      const end = match.index + full.length;
      consumedSpans.push({ start, end });
      const childAttributes = this.parseAttributesManually(childAttrString);
      const nestedChildren = [];
      const nestedClosingRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)>([\s\S]*?)<\/\1>/g;
      let nestedMatch;
      let remainingChildText = childInner;
      while ((nestedMatch = nestedClosingRegex.exec(childInner)) !== null) {
        const [nestedFull, nestedTagName, nestedAttrString, nestedInner] = nestedMatch;
        nestedChildren.push({
          name: nestedTagName,
          attributes: this.parseAttributesManually(nestedAttrString),
          children: [],
          text: nestedInner.trim()
        });
        remainingChildText = remainingChildText.replace(nestedFull, "").trim();
      }
      const nestedSelfClosingRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)\/>/g;
      let nestedSelfMatch;
      while ((nestedSelfMatch = nestedSelfClosingRegex.exec(childInner)) !== null) {
        const nestedTagName = nestedSelfMatch[1];
        const nestedAttrString = nestedSelfMatch[2];
        nestedChildren.push({
          name: nestedTagName,
          attributes: this.parseAttributesManually(nestedAttrString),
          children: [],
          text: ""
        });
      }
      children.push({
        name: childTagName,
        attributes: childAttributes,
        children: nestedChildren,
        text: remainingChildText.trim()
      });
    }
    const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9_:.-]*)([^>]*)\/>/g;
    let selfMatch;
    while ((selfMatch = selfClosingRegex.exec(content)) !== null) {
      const start = selfMatch.index;
      const end = selfClosingRegex.lastIndex;
      const overlaps = consumedSpans.some((span) => !(end <= span.start || start >= span.end));
      if (overlaps) continue;
      const childTagName = selfMatch[1];
      const childAttrString = selfMatch[2];
      children.push({
        name: childTagName,
        attributes: this.parseAttributesManually(childAttrString),
        children: [],
        text: ""
      });
    }
    textContent = content.trim();
    return { textContent, children };
  }
  /**
   * Parse attributes manually from attribute string
   */
  parseAttributesManually(attrString) {
    const attributes = {};
    const regex = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }
    return attributes;
  }
}
const DOCTYPE_PATTERN = /<!DOCTYPE LexicalResource SYSTEM "([^"]+)">/;
const LMF_SCHEMAS = {
  "1.0": "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd",
  "1.1": "http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd",
  "1.2": "http://globalwordnet.github.io/schemas/WN-LMF-1.2.dtd",
  "1.3": "http://globalwordnet.github.io/schemas/WN-LMF-1.3.dtd",
  "1.4": "http://globalwordnet.github.io/schemas/WN-LMF-1.4.dtd"
};
const SUPPORTED_LMF_VERSIONS = /* @__PURE__ */ new Set(["1.0", "1.1", "1.2", "1.3", "1.4"]);
function extractLMFVersion(xmlContent, options = {}) {
  const { debug = false, defaultVersion } = options;
  if (debug) {
    console.log(`[DEBUG] Extracting LMF version from XML content...`);
  }
  const versionMatch = xmlContent.match(/lmfVersion="([^"]*)"/);
  if (versionMatch) {
    const version2 = versionMatch[1];
    if (debug) {
      console.log(`[DEBUG] Found lmfVersion attribute: ${version2}`);
    }
    return version2;
  }
  const formatMatch = xmlContent.match(/<dc:format>([^<]*)<\/dc:format>/);
  if (formatMatch && formatMatch[1]) {
    const format = formatMatch[1];
    const versionMatch2 = format.match(/WN-LMF\s+(\d+\.\d+)/);
    if (versionMatch2) {
      const version2 = versionMatch2[1];
      if (debug) {
        console.log(`[DEBUG] Found version in dc:format: ${version2}`);
      }
      return version2;
    }
  }
  let version = defaultVersion || "1.0";
  const match = xmlContent.match(DOCTYPE_PATTERN);
  if (match?.[1]) {
    const schemaUrl = match[1];
    if (debug) {
      console.log(`[DEBUG] Found DOCTYPE with schema: ${schemaUrl}`);
    }
    let foundSupported = false;
    for (const [ver, url] of Object.entries(LMF_SCHEMAS)) {
      if (url === schemaUrl) {
        version = ver;
        foundSupported = true;
        if (debug) {
          console.log(`[DEBUG] Matched schema URL to supported version: ${version}`);
        }
        break;
      }
    }
    if (!foundSupported) {
      const versionMatch2 = schemaUrl.match(/WN-LMF-([0-9]+\.[0-9]+)\.dtd$/);
      if (versionMatch2 && versionMatch2[1]) {
        version = versionMatch2[1];
        if (debug) {
          console.log(`[DEBUG] Extracted version from schema URL: ${version}`);
        }
      }
    }
  } else {
    if (debug) {
      console.log(`[DEBUG] No DOCTYPE pattern found, using default version: ${version}`);
    }
  }
  if (debug) {
    console.log(`[DEBUG] Final extracted version: ${version}`);
  }
  return version;
}
function validateLMFVersion(version, options = {}) {
  const { allowUnsupported = true, supportedVersions = SUPPORTED_LMF_VERSIONS } = options;
  if (!version) {
    return {
      isValid: false,
      isSupported: false,
      version,
      error: "Version is empty or undefined"
    };
  }
  const isSupported = supportedVersions.has(version);
  if (!isSupported && !allowUnsupported) {
    return {
      isValid: false,
      isSupported: false,
      version,
      error: `Unsupported LMF version: ${version}`
    };
  }
  return {
    isValid: true,
    isSupported,
    version
  };
}
function extractAndValidateLMFVersion(xmlContent, options = {}) {
  const extractedVersion = extractLMFVersion(xmlContent, options);
  if (!extractedVersion) {
    return {
      version: void 0,
      isValid: false,
      isSupported: false,
      error: "No LMF version found in XML content"
    };
  }
  const validation = validateLMFVersion(extractedVersion, options);
  return {
    version: extractedVersion,
    isValid: validation.isValid,
    isSupported: validation.isSupported,
    ...validation.error && { error: validation.error }
  };
}
class LMFParseError extends Error {
  constructor(message, code, context) {
    super(message);
    this.code = code;
    this.context = context;
    this.name = "LMFParseError";
  }
}
class DuplicateHandler {
  constructor(config) {
    this.config = config;
  }
  statistics = {
    wordsDeduplicated: 0,
    synsetsDeduplicated: 0,
    sensesDeduplicated: 0,
    totalDuplicates: 0
  };
  /**
   * Handle duplicates according to the configured strategy
   */
  handleDuplicates(items, type) {
    if (this.config.strategy === "skip") {
      return items;
    }
    const uniqueKeys = this.config.uniqueKeys?.[type];
    if (!uniqueKeys || uniqueKeys.length === 0) {
      return items;
    }
    const seen = /* @__PURE__ */ new Map();
    const duplicates = [];
    for (const item of items) {
      const key = this.generateUniqueKey(item, uniqueKeys, type);
      if (seen.has(key)) {
        duplicates.push(item);
        this.statistics.totalDuplicates++;
        if (this.config.logDuplicates) {
          console.debug(`Duplicate ${type} found:`, { key, itemId: item.id });
        }
        const existing = seen.get(key);
        switch (this.config.strategy) {
          case "keep-first":
            break;
          case "keep-last":
            seen.set(key, item);
            break;
          case "merge":
            const merged = this.mergeItems(existing, item, type);
            seen.set(key, merged);
            break;
          case "error":
            throw new LMFParseError(
              `Duplicate ${type} found with key: ${key}`,
              "DUPLICATE_FOUND",
              { key, itemId: item.id, type }
            );
        }
      } else {
        seen.set(key, item);
      }
    }
    switch (type) {
      case "words":
        this.statistics.wordsDeduplicated = duplicates.length;
        break;
      case "synsets":
        this.statistics.synsetsDeduplicated = duplicates.length;
        break;
      case "senses":
        this.statistics.sensesDeduplicated = duplicates.length;
        break;
    }
    return Array.from(seen.values());
  }
  /**
   * Generate a unique key for an item based on the specified unique key fields
   */
  generateUniqueKey(item, uniqueKeys, type) {
    const keyParts = [];
    for (const key of uniqueKeys) {
      switch (key) {
        case "id":
          keyParts.push(item.id || "");
          break;
        case "lemma":
          if (type === "words") {
            keyParts.push(item.lemma || "");
          }
          break;
        case "index":
          if (type === "words") {
            keyParts.push(item.index || "");
          }
          break;
        case "pos":
          if (type === "words") {
            keyParts.push(item.pos || "");
          }
          break;
        case "ili":
          if (type === "synsets") {
            keyParts.push(item.ili || "");
          }
          break;
        case "wordId-synsetId":
          if (type === "senses") {
            const sense = item;
            keyParts.push(sense.wordId || "");
            keyParts.push(sense.synsetId || "");
          }
          break;
      }
    }
    return keyParts.filter(Boolean).join("::");
  }
  /**
   * Merge two items according to the merge strategy
   */
  mergeItems(existing, current, type) {
    if (this.config.strategy !== "merge") {
      return existing;
    }
    const merged = { ...existing };
    const mergeFields = this.config.mergeFields;
    if (type === "words" && mergeFields?.forms) {
      const existingWord = existing;
      const currentWord = current;
      if ("forms" in existingWord && "forms" in currentWord) {
        merged.forms = [...existingWord.forms, ...currentWord.forms];
      }
    }
    if (type === "synsets") {
      const existingSynset = existing;
      const currentSynset = current;
      if (mergeFields?.definitions && "definitions" in existingSynset && "definitions" in currentSynset) {
        merged.definitions = [...existingSynset.definitions, ...currentSynset.definitions];
      }
      if (mergeFields?.examples && "examples" in existingSynset && "examples" in currentSynset) {
        merged.examples = [...existingSynset.examples, ...currentSynset.examples];
      }
      if (mergeFields?.relations && "relations" in existingSynset && "relations" in currentSynset) {
        merged.relations = [...existingSynset.relations, ...currentSynset.relations];
      }
    }
    if (type === "senses") {
      const existingSense = existing;
      const currentSense = current;
      if (mergeFields?.examples && "examples" in existingSense && "examples" in currentSense) {
        merged.examples = [...existingSense.examples, ...currentSense.examples];
      }
      if (mergeFields?.tags && "tags" in existingSense && "tags" in currentSense) {
        merged.tags = [...existingSense.tags, ...currentSense.tags];
      }
      if (mergeFields?.counts && "counts" in existingSense && "counts" in currentSense) {
        merged.counts = [...existingSense.counts, ...currentSense.counts];
      }
    }
    return merged;
  }
  /**
   * Get duplicate handling statistics
   */
  getStatistics() {
    return { ...this.statistics };
  }
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      wordsDeduplicated: 0,
      synsetsDeduplicated: 0,
      sensesDeduplicated: 0,
      totalDuplicates: 0
    };
  }
}
function validateLMFContentEnhanced(xmlContent, debug = false) {
  if (typeof xmlContent !== "string") {
    throw new LMFParseError(
      "XML content is not a valid string",
      "INVALID_CONTENT_TYPE",
      { contentType: typeof xmlContent }
    );
  }
  if (xmlContent.trim().length === 0) {
    throw new LMFParseError(
      "XML content is empty",
      "EMPTY_CONTENT",
      { contentLength: xmlContent.length }
    );
  }
  const trimmedContent = xmlContent.trim();
  if (trimmedContent.toLowerCase().includes("<!doctype html>") || trimmedContent.toLowerCase().includes("<html") || trimmedContent.toLowerCase().includes("error") && trimmedContent.toLowerCase().includes("not found") && (trimmedContent.toLowerCase().includes("http error") || trimmedContent.toLowerCase().includes("error 404") || trimmedContent.toLowerCase().includes("error 500") || trimmedContent.toLowerCase().includes("error 403"))) {
    throw new LMFParseError(
      "Content appears to be HTML error page, not XML",
      "HTML_ERROR_PAGE",
      {
        hasDoctype: trimmedContent.toLowerCase().includes("<!doctype html>"),
        hasHtml: trimmedContent.toLowerCase().includes("<html"),
        hasError: trimmedContent.toLowerCase().includes("error")
      }
    );
  }
  if (trimmedContent.toLowerCase().includes("http") && !trimmedContent.toLowerCase().includes("<!doctype") && (trimmedContent.toLowerCase().includes("404") || trimmedContent.toLowerCase().includes("500") || trimmedContent.toLowerCase().includes("403"))) {
    throw new LMFParseError(
      "Server returned HTTP error page",
      "HTTP_ERROR_RESPONSE",
      {
        has404: trimmedContent.toLowerCase().includes("404"),
        has500: trimmedContent.toLowerCase().includes("500"),
        has403: trimmedContent.toLowerCase().includes("403")
      }
    );
  }
  if (!trimmedContent.startsWith("<?xml") && !trimmedContent.startsWith("<")) {
    throw new LMFParseError(
      "Content does not appear to be XML",
      "NOT_XML",
      {
        startsWithXml: trimmedContent.startsWith("<?xml"),
        startsWithTag: trimmedContent.startsWith("<"),
        firstChars: trimmedContent.substring(0, 50)
      }
    );
  }
  if (!trimmedContent.includes("<LexicalResource")) {
    throw new LMFParseError(
      "missing LexicalResource element",
      "MISSING_LEXICAL_RESOURCE",
      {
        hasLexicalResource: trimmedContent.includes("<LexicalResource"),
        firstChars: trimmedContent.substring(0, 200)
      }
    );
  }
  const openTags = (trimmedContent.match(/</g) || []).length;
  const closeTags = (trimmedContent.match(/>/g) || []).length;
  if (openTags !== closeTags) {
    throw new LMFParseError(
      "Malformed XML - mismatched tags",
      "MALFORMED_XML",
      {
        openTags,
        closeTags,
        difference: Math.abs(openTags - closeTags)
      }
    );
  }
  if (debug) {
    console.log(`[DEBUG] Enhanced XML content validation passed`);
    console.log(`[DEBUG] Content length: ${xmlContent.length}`);
    console.log(`[DEBUG] First 200 characters:`, trimmedContent.substring(0, 200));
  }
}
const DEFAULT_DUPLICATE_HANDLING = {
  strategy: "keep-first",
  mergeFields: {
    definitions: true,
    examples: true,
    relations: true,
    forms: true,
    pronunciations: true,
    tags: true,
    counts: true
  },
  uniqueKeys: {
    words: ["id"],
    synsets: ["id"],
    senses: ["id"]
  },
  logDuplicates: false,
  trackStatistics: true
};
function applyDuplicateHandling(document, config = DEFAULT_DUPLICATE_HANDLING) {
  const handler = new DuplicateHandler(config);
  return {
    ...document,
    words: handler.handleDuplicates(document.words, "words"),
    synsets: handler.handleDuplicates(document.synsets, "synsets"),
    senses: handler.handleDuplicates(document.senses, "senses")
  };
}
class WarningAggregator {
  warnings = /* @__PURE__ */ new Map();
  batchSize;
  flushInterval;
  flushTimer;
  constructor(batchSize = 100, flushIntervalMs = 5e3) {
    this.batchSize = batchSize;
    this.flushInterval = flushIntervalMs;
    this.startFlushTimer();
  }
  addWarning(type, message, exampleId) {
    const key = `${type}:${message}`;
    if (this.warnings.has(key)) {
      const existing = this.warnings.get(key);
      existing.count++;
      existing.lastOccurrence = /* @__PURE__ */ new Date();
      if (exampleId && existing.examples.length < 3) {
        existing.examples.push(exampleId);
      }
    } else {
      this.warnings.set(key, {
        type,
        message,
        count: 1,
        examples: exampleId ? [exampleId] : [],
        firstOccurrence: /* @__PURE__ */ new Date(),
        lastOccurrence: /* @__PURE__ */ new Date()
      });
    }
    const totalWarnings = Array.from(this.warnings.values()).reduce((sum, w) => sum + w.count, 0);
    if (totalWarnings >= this.batchSize) {
      if (process.env.NODE_ENV !== "test") {
        this.flush();
      }
    }
  }
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  flush() {
    if (this.warnings.size === 0) {
      return {
        totalWarnings: 0,
        uniqueWarningTypes: 0,
        warnings: [],
        summary: "No warnings"
      };
    }
    const warnings = Array.from(this.warnings.values());
    const totalWarnings = warnings.reduce((sum, w) => sum + w.count, 0);
    const summary = this.generateSummary(warnings, totalWarnings);
    this.warnings.clear();
    return {
      totalWarnings,
      uniqueWarningTypes: warnings.length,
      warnings,
      summary
    };
  }
  generateSummary(warnings, total) {
    const topWarnings = warnings.sort((a, b) => b.count - a.count).slice(0, 3);
    return `Found ${total} warnings across ${warnings.length} types. Top issues: ${topWarnings.map((w) => `${w.type} (${w.count})`).join(", ")}`;
  }
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}
function asParsedXMLStructure(obj) {
  return obj;
}
class LmfParser {
  constructor(source, options = {}) {
    this.source = source;
    this.options = {
      debug: false,
      verbose: false,
      validate: true,
      mergeStrategy: "auto",
      resolutionStrategy: "hybrid",
      progressCallback: void 0,
      warningAggregation: {
        enabled: true,
        batchSize: 10,
        flushIntervalMs: 5e3
      },
      duplicateHandling: {
        strategy: "keep-first",
        mergeFields: {
          definitions: true,
          examples: true,
          relations: true,
          forms: true,
          pronunciations: true,
          tags: true,
          counts: true
        },
        uniqueKeys: {
          words: ["id", "lemma", "pos"],
          synsets: ["id"],
          senses: ["id", "wordId-synsetId"]
        },
        logDuplicates: false,
        trackStatistics: true
      },
      ...options
    };
    if (this.options.warningAggregation?.enabled) {
      this.warningAggregator = new WarningAggregator(
        this.options.warningAggregation.batchSize || 10,
        this.options.warningAggregation.flushIntervalMs || 5e3
      );
    }
    this.duplicateHandler = new DuplicateHandler(this.options.duplicateHandling || DEFAULT_DUPLICATE_HANDLING);
    this.logger = createScopedLogger("LmfParser", this.options.debug ? "debug" : "info");
  }
  name = "Browser LMF Parser";
  description = "Browser-compatible LMF parser with multiple XML parsing strategies";
  options;
  logger = createScopedLogger("LmfParser");
  warningAggregator;
  duplicateHandler;
  // Aggregated statistics for better logging
  stats = {
    synsetsProcessed: 0,
    synsetsWithDefinitions: 0,
    totalDefinitions: 0,
    definitionsWithText: 0,
    synsetsWithExamples: 0,
    totalExamples: 0
  };
  /**
   * Parse the LMF XML content into a structured document
   * This method implements the common LMFParser interface
   */
  async parse(xmlContent, options) {
    const debug = options?.debug || this.options.debug;
    let progressCallback;
    if (options?.progress) {
      const progressFn = options.progress;
      progressCallback = (stage, current, total, details) => {
        const progress = total ? current / total : 0;
        progressFn(progress);
      };
    } else {
      progressCallback = this.options.progressCallback;
    }
    const mergedOptions = { ...this.options, ...options };
    try {
      if (debug && this.options.verbose) {
        this.logger.debug("[DEBUG] LmfParser.parse() starting with", {
          xmlLength: xmlContent.length,
          firstChars: xmlContent.substring(0, 500)
        });
      }
      if (mergedOptions.validate) {
        progressCallback?.("validating", 0, 1, {
          contentLength: xmlContent.length
        });
        if (xmlContent === null || xmlContent === void 0) {
          throw new Error("Invalid LMF file: XML content is not a valid string");
        }
        if (typeof xmlContent !== "string") {
          throw new Error("Invalid LMF file: XML content is not a valid string");
        }
        try {
          validateLMFContentEnhanced(xmlContent, debug);
        } catch (error) {
          if (error instanceof LMFParseError) {
            throw new Error(`Invalid LMF file: ${error.message}`);
          }
          throw error;
        }
        const versionResult = extractAndValidateLMFVersion(xmlContent, {
          debug,
          allowUnsupported: false,
          // Don't allow unsupported versions
          supportedVersions: SUPPORTED_LMF_VERSIONS
        });
        if (debug) {
          this.logger.debug(`[DEBUG] Extracted LMF version: ${versionResult.version}`);
          this.logger.debug(`[DEBUG] Supported versions: ${Array.from(SUPPORTED_LMF_VERSIONS).join(", ")}`);
          this.logger.debug(`[DEBUG] Version ${versionResult.version} supported: ${versionResult.isSupported}`);
        }
        if (!versionResult.isValid || !versionResult.isSupported) {
          if (debug) {
            this.logger.debug(`[DEBUG] Throwing error for version: ${versionResult.version}, error: ${versionResult.error}`);
          }
          throw new LMFParseError(
            versionResult.error || `Unsupported LMF version: ${versionResult.version}`,
            "UNSUPPORTED_VERSION",
            { version: versionResult.version }
          );
        }
        if (debug && this.options.verbose) {
          this.logger.debug("XML content validation passed");
        }
        progressCallback?.("validating", 1, 1);
      }
      progressCallback?.("parsing_xml", 0, 1);
      if (debug && this.options.verbose) {
        this.logger.debug("[DEBUG] Parsing XML with DOMParser");
      }
      const xmlParserOptions = {
        debug
      };
      const xmlParser = new MultiXMLParser(xmlContent, xmlParserOptions);
      const xmlResult = await xmlParser.parse();
      progressCallback?.("parsing_xml", 1, 1, {
        parserUsed: xmlResult.parserUsed
      });
      progressCallback?.("converting", 0, 1);
      const result = this.convertXMLResultToLMFDocument(
        xmlResult,
        xmlContent,
        progressCallback,
        mergedOptions
      );
      progressCallback?.("converting", 1, 1);
      progressCallback?.("completed", 1, 1, {
        lexicons: result.lexicons.length,
        words: result.words.length,
        synsets: result.synsets.length,
        senses: result.senses.length
      });
      this.logger.info("LMF parsing statistics", {
        synsetsProcessed: this.stats.synsetsProcessed,
        synsetsWithDefinitions: this.stats.synsetsWithDefinitions,
        totalDefinitions: this.stats.totalDefinitions,
        definitionsWithText: this.stats.definitionsWithText,
        definitionTextExtractionRate: this.stats.totalDefinitions > 0 ? `${Math.round(this.stats.definitionsWithText / this.stats.totalDefinitions * 100)}%` : "N/A",
        synsetsWithExamples: this.stats.synsetsWithExamples,
        totalExamples: this.stats.totalExamples
      });
      this.logger.info("LMF parsing completed successfully", {
        lexicons: result.lexicons.length,
        words: result.words.length,
        synsets: result.synsets.length,
        senses: result.senses.length,
        totalSize: xmlContent.length
      });
      if (this.options.duplicateHandling?.trackStatistics) {
        const duplicateStats = this.duplicateHandler.getStatistics();
        if (duplicateStats.totalDuplicates > 0) {
          this.logger.info("Duplicate handling statistics", duplicateStats);
        }
      }
      this.logger.debug("LMF parsing completed with schema-compliant structure");
      if (this.warningAggregator && process.env.NODE_ENV !== "test") {
        const aggregatedWarnings = this.warningAggregator.flush();
        if (aggregatedWarnings.totalWarnings > 0) {
          this.logger.warn("Parsing completed with aggregated warnings", aggregatedWarnings);
        }
      }
      if (mergedOptions.duplicateHandling && mergedOptions.duplicateHandling.strategy !== "skip") {
        if (mergedOptions.debug) {
          this.logger.debug(`Applying final duplicate handling with strategy: ${mergedOptions.duplicateHandling.strategy}`);
          this.logger.debug(`Before final deduplication - words: ${result.words.length}, synsets: ${result.synsets.length}, senses: ${result.senses.length}`);
        }
        try {
          const deduplicatedResult = applyDuplicateHandling(result, mergedOptions.duplicateHandling);
          result.words = deduplicatedResult.words;
          result.synsets = deduplicatedResult.synsets;
          result.senses = deduplicatedResult.senses;
          if (mergedOptions.debug) {
            this.logger.debug(`After final deduplication - words: ${result.words.length}, synsets: ${result.synsets.length}, senses: ${result.senses.length}`);
          }
        } catch (error) {
          if (error instanceof LMFParseError) {
            throw error;
          }
          throw new LMFParseError(
            `Duplicate handling failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            "DUPLICATE_HANDLING_FAILED",
            { originalError: error }
          );
        }
      }
      this.logger.info(`🎉 LMF parsing completed successfully!`);
      this.logger.info(`📊 Final results: ${result.lexicons.length} lexicons, ${result.words.length} words, ${result.synsets.length} synsets, ${result.senses.length} senses`);
      this.logger.info(`🚀 Ready to insert data into database...`);
      return result;
    } catch (error) {
      if (this.warningAggregator) {
        const aggregatedWarnings = this.warningAggregator.flush();
        if (aggregatedWarnings.totalWarnings > 0) {
          this.logger.warn("Parsing failed with aggregated warnings", aggregatedWarnings);
        }
      }
      this.logger.error("LMF parsing failed", error);
      throw error;
    }
  }
  /**
   * Convert the parsed XML result to an LMFDocument
   */
  convertXMLResultToLMFDocument(xmlResult, originalContent, progressCallback, mergedOptions) {
    const options = mergedOptions || this.options;
    if (!xmlResult) {
      this.logger.error(
        "convertXMLResultToLMFDocument: xmlResult is null/undefined"
      );
      throw new Error("XML parsing result is null or undefined");
    }
    if (typeof xmlResult !== "object") {
      this.logger.error(
        "convertXMLResultToLMFDocument: xmlResult is not an object",
        {
          type: typeof xmlResult,
          value: xmlResult
        }
      );
      throw new Error("XML parsing result is not an object");
    }
    const result = {
      lmfVersion: "1.0",
      lexicons: [],
      synsets: [],
      words: [],
      senses: []
    };
    let xmlData;
    if (xmlResult.data) {
      xmlData = asParsedXMLStructure(xmlResult.data);
      this.logger.debug(`Using MultiXMLParser result structure with data property`);
    } else {
      xmlData = asParsedXMLStructure(xmlResult);
      this.logger.debug(`Using direct XML result structure`);
    }
    this.logger.debug(`XML data keys:`, Object.keys(xmlData));
    const lexicalResource = xmlData.LexicalResource;
    if (lexicalResource) {
      this.logger.debug(`LexicalResource keys:`, Object.keys(lexicalResource));
      if (lexicalResource.children) {
        this.logger.debug(`LexicalResource has children array with ${lexicalResource.children.length} elements`);
      }
    }
    if (!lexicalResource) {
      this.logger.warn(
        "convertXMLResultToLMFDocument: No LexicalResource found in XML data",
        {
          hasData: !!xmlResult.data,
          rootKeys: Object.keys(xmlResult.data || xmlResult),
          xmlResultType: typeof xmlResult
        }
      );
    }
    if (lexicalResource && lexicalResource.attributes && lexicalResource.attributes.lmfVersion) {
      result.lmfVersion = lexicalResource.attributes.lmfVersion;
    }
    if (lexicalResource) {
      this.logger.debug(`Found LexicalResource, processing...`);
      this.logger.debug(`LexicalResource type:`, typeof lexicalResource);
      this.logger.debug(`LexicalResource keys:`, Object.keys(lexicalResource));
      if (lexicalResource.children) {
        this.logger.debug(`LexicalResource.children type:`, typeof lexicalResource.children);
        this.logger.debug(`LexicalResource.children is array:`, Array.isArray(lexicalResource.children));
        if (Array.isArray(lexicalResource.children)) {
          this.logger.debug(`LexicalResource.children length:`, lexicalResource.children.length);
          this.logger.debug(`First few children:`, lexicalResource.children.slice(0, 3).map((c) => ({ name: c.name, type: typeof c })));
        }
      }
      this.processLexicalResource(lexicalResource, result, progressCallback, options);
    }
    const nothingExtracted = result.lexicons.length + result.words.length + result.synsets.length + result.senses.length === 0;
    if (nothingExtracted) {
      this.logger.debug(
        "No data extracted from XML parser, using enhanced regex fallback"
      );
      this.parseWithEnhancedRegex(originalContent, result, progressCallback, options);
    }
    if (result.words.length === 0 && result.synsets.length === 0) {
      this.logger.warn("LMF parsing: Very little data extracted", {
        lexicons: result.lexicons.length,
        words: result.words.length,
        synsets: result.synsets.length,
        senses: result.senses.length
      });
    }
    return result;
  }
  /**
   * Process the LexicalResource element and extract all LMF data
   */
  processLexicalResource(element, result, progressCallback, mergedOptions) {
    const options = mergedOptions || this.options;
    this.logger.debug(`processLexicalResource called with element:`, {
      type: typeof element,
      keys: Object.keys(element),
      hasChildren: !!element.children,
      childrenType: element.children ? typeof element.children : "none",
      childrenLength: element.children && Array.isArray(element.children) ? element.children.length : 0
    });
    if (!element) {
      this.logger.warn("processLexicalResource: element is null/undefined");
      return;
    }
    if (typeof element !== "object") {
      this.logger.warn("processLexicalResource: element is not an object", {
        type: typeof element,
        value: element
      });
      return;
    }
    const lexicons = [];
    const words = [];
    const synsets = [];
    const senses = [];
    if (!element.children || !Array.isArray(element.children)) {
      this.logger.warn("processLexicalResource: unexpected element structure", {
        hasChildren: !!element.children,
        childrenType: element.children ? typeof element.children : "none",
        childrenLength: element.children && Array.isArray(element.children) ? element.children.length : 0
      });
    }
    if (element.children && Array.isArray(element.children)) {
      this.logger.debug(`Using new MultiXMLParser structure with ${element.children.length} children`);
      const totalChildren = element.children?.length || 0;
      progressCallback?.("processing_children", 0, totalChildren, {
        totalChildren
      });
      element.children.some(
        (c) => c?.name === "Lexicon" || c?.name === "LexiconExtension"
      );
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        progressCallback?.("processing_children", i, totalChildren, {
          currentChild: child.name,
          childIndex: i
        });
        if (child.name === "Lexicon" || child.name === "LexiconExtension") {
          this.logger.debug(`Found lexicon element:`, {
            name: child.name,
            hasAttributes: !!child.attributes,
            attributes: child.attributes,
            elementKeys: Object.keys(child)
          });
          const lexicon = this.processLexicon(asParsedXMLStructure(child));
          if (lexicon) {
            lexicons.push(lexicon);
            const includeIntoAggregates = child.name === "Lexicon";
            this.logger.debug(`Processing lexicon ${lexicon.id} with language ${lexicon.language}, includeIntoAggregates=${includeIntoAggregates}`);
            this.processLexiconContents(asParsedXMLStructure(child), words, synsets, senses, includeIntoAggregates, options);
          } else {
            this.logger.warn(`Failed to process lexicon element:`, child);
          }
        } else {
          if (child.name === "LexicalEntry") {
            const primaryLexiconId = lexicons.length > 0 ? lexicons[0].id : "unknown";
            const word = this.processLexicalEntry(asParsedXMLStructure(child), primaryLexiconId);
            if (word) {
              words.push(word);
            }
          } else if (child.name === "Synset") {
            const primaryLexiconId = lexicons.length > 0 ? lexicons[0].id : "unknown";
            const synset = this.processSynset(asParsedXMLStructure(child), primaryLexiconId);
            if (synset) {
              synsets.push(synset);
            }
          } else if (child.name === "Sense") {
            const sense = this.processSense(asParsedXMLStructure(child), void 0);
            if (sense) {
              senses.push(sense);
            }
          }
        }
      }
    } else {
      if (options.debug && this.options.verbose) {
        this.logger.debug(`Using old structure - processing object properties`);
      }
      const keys = Object.keys(element);
      const totalKeys = keys.length;
      progressCallback?.("processing_old_structure", 0, totalKeys, {
        totalKeys
      });
      let keyIndex = 0;
      const hasLexiconKey = Object.prototype.hasOwnProperty.call(element, "Lexicon") || Object.prototype.hasOwnProperty.call(element, "LexiconExtension");
      for (const key of keys) {
        progressCallback?.("processing_old_structure", keyIndex, totalKeys, {
          currentKey: key,
          keyIndex
        });
        if (Object.prototype.hasOwnProperty.call(element, key)) {
          const childElement = element[key];
          if (typeof childElement === "object" && childElement !== null && !Array.isArray(childElement)) {
            switch (key) {
              case "Lexicon":
              case "LexiconExtension":
                const lexicon = this.processLexicon(asParsedXMLStructure(childElement));
                if (lexicon) {
                  lexicons.push(lexicon);
                  const includeIntoAggregates = key === "Lexicon";
                  this.logger.debug(`Processing lexicon ${lexicon.id} with language ${lexicon.language}, includeIntoAggregates=${includeIntoAggregates}`);
                  this.processLexiconContents(
                    asParsedXMLStructure(childElement),
                    words,
                    synsets,
                    senses,
                    includeIntoAggregates,
                    options
                  );
                }
                break;
              case "LexicalEntry":
                if (!hasLexiconKey) {
                  const primaryLexiconId2 = lexicons.length > 0 ? lexicons[0].id : "unknown";
                  const word = this.processLexicalEntry(asParsedXMLStructure(childElement), primaryLexiconId2);
                  if (word) {
                    words.push(word);
                  }
                }
                break;
              case "Synset":
                if (!hasLexiconKey) {
                  const primaryLexiconId2 = lexicons.length > 0 ? lexicons[0].id : "unknown";
                  const synset = this.processSynset(asParsedXMLStructure(childElement), primaryLexiconId2);
                  if (synset) {
                    synsets.push(synset);
                  }
                }
                break;
              case "Sense":
                if (!hasLexiconKey) {
                  const sense = this.processSense(asParsedXMLStructure(childElement), void 0);
                  if (sense) {
                    senses.push(sense);
                  }
                }
                break;
            }
          }
        }
        keyIndex++;
      }
    }
    if (lexicons.length === 0 && words.length === 0 && synsets.length === 0 && senses.length === 0) {
      this.logger.warn(
        "processLexicalResource: No data extracted from element",
        {
          hasChildren: !!element.children,
          childrenType: element.children ? typeof element.children : "none",
          childrenLength: element.children && Array.isArray(element.children) ? element.children.length : 0
        }
      );
    }
    if (lexicons.length > 0) {
      result.lexicons = lexicons;
    }
    if (words.length > 0) {
      result.words = words;
    }
    if (synsets.length > 0) {
      result.synsets = synsets;
    }
    if (senses.length > 0) {
      result.senses = senses;
    }
  }
  /**
   * Process the contents of a Lexicon element (LexicalEntry, Synset, Sense)
   */
  processLexiconContents(lexiconElement, words, synsets, senses, includeIntoAggregates = true, mergedOptions) {
    const options = mergedOptions || this.options;
    if (!lexiconElement || typeof lexiconElement !== "object" || !lexiconElement.children && !lexiconElement.LexicalEntry) {
      if (options.debug) {
        this.logger.warn(`Invalid lexicon element structure:`, {
          hasElement: !!lexiconElement,
          elementType: lexiconElement ? typeof lexiconElement : "none",
          hasChildren: !!lexiconElement?.children,
          hasLexicalEntry: !!lexiconElement?.LexicalEntry
        });
      }
      return;
    }
    if (options.debug && this.options.verbose) {
      this.logger.debug(`Processing lexicon contents:`, {
        hasChildren: !!lexiconElement.children,
        childrenType: lexiconElement.children ? typeof lexiconElement.children : "none",
        childrenLength: lexiconElement.children ? lexiconElement.children.length : 0,
        elementKeys: Object.keys(lexiconElement)
      });
    }
    if (lexiconElement.children && Array.isArray(lexiconElement.children)) {
      if (options.debug && this.options.verbose) {
        this.logger.debug(
          `Using new MultiXMLParser structure with ${lexiconElement.children.length} children`
        );
      }
      const lexiconLanguage = lexiconElement.attributes?.language || lexiconElement.language || void 0;
      const pendingWords = [];
      const pendingSensesGlobal = [];
      const pendingSynsets = [];
      for (const child of lexiconElement.children) {
        if (child.name === "LexicalEntry") {
          const word = this.processLexicalEntry(asParsedXMLStructure(child), lexiconElement.attributes?.id || "unknown");
          if (word) {
            if (lexiconLanguage) {
              word.language = lexiconLanguage;
            }
            pendingWords.push(word);
            if (child.children && Array.isArray(child.children)) {
              for (const senseChild of child.children) {
                if (senseChild.name === "Sense") {
                  const sense = this.processSense(asParsedXMLStructure(senseChild), word.id);
                  if (sense) {
                    const lexicalizedAttr = senseChild.attributes?.lexicalized ?? senseChild.lexicalized;
                    if (typeof lexicalizedAttr === "string" && lexicalizedAttr === "false") ;
                    else {
                      pendingSensesGlobal.push(sense);
                    }
                  } else if (options.debug) {
                    this.logger.warn(`No sense found for Sense element:`, senseChild);
                  }
                }
              }
            }
          } else {
            if (options.debug) {
              this.logger.warn(
                `No word found for LexicalEntry element:`,
                child
              );
            }
          }
        }
      }
      for (const child of lexiconElement.children) {
        if (child.name === "Synset") {
          const synset = this.processSynset(asParsedXMLStructure(child), lexiconElement.attributes?.id || "unknown");
          if (synset) {
            if (lexiconLanguage) {
              synset.language = lexiconLanguage;
            }
            pendingSynsets.push(synset);
          } else {
            if (options.debug) {
              this.logger.warn(`No synset found for Synset element:`, child);
            }
          }
        }
      }
      let standaloneSenseCount = 0;
      for (const child of lexiconElement.children) {
        if (child.name === "Sense" && !child.parent) {
          standaloneSenseCount++;
          if (options.debug) {
            this.logger.debug(
              `Found standalone Sense element outside LexicalEntry - this is invalid LMF XML:`,
              { senseId: child.attributes?.id || "unknown", synset: child.attributes?.synset || "unknown" }
            );
          }
          continue;
        }
      }
      if (standaloneSenseCount > 0) {
        this.logger.info(
          `Skipped ${standaloneSenseCount} standalone sense(s) - all senses must be nested in LexicalEntry according to LMF specification`
        );
      }
      if (!includeIntoAggregates) {
        return;
      }
      const synsetHasDefinition = {};
      for (const syn of pendingSynsets) {
        synsetHasDefinition[syn.id] = syn.definitions && syn.definitions.length > 0;
      }
      Object.values(synsetHasDefinition).some(Boolean);
      pendingSensesGlobal.slice();
      pendingWords.slice();
      if (options.debug) {
        this.logger.debug(`Using correct LMF processing order - all senses properly nested in LexicalEntry`);
      }
      if (options.duplicateHandling && options.duplicateHandling.strategy !== "skip") {
        if (options.debug) {
          this.logger.debug(`Applying duplicate handling with strategy: ${options.duplicateHandling.strategy}`);
          this.logger.debug(`Before deduplication - words: ${pendingWords.length}, synsets: ${pendingSynsets.length}, senses: ${pendingSensesGlobal.length}`);
        }
        const deduplicatedWords = this.duplicateHandler.handleDuplicates(pendingWords, "words");
        const deduplicatedSynsets = this.duplicateHandler.handleDuplicates(pendingSynsets, "synsets");
        const deduplicatedSenses = this.duplicateHandler.handleDuplicates(pendingSensesGlobal, "senses");
        for (const w of deduplicatedWords) words.push(w);
        for (const syn of deduplicatedSynsets) synsets.push(syn);
        for (const s of deduplicatedSenses) senses.push(s);
        if (options.debug) {
          this.logger.debug(`After deduplication - words: ${words.length}, synsets: ${synsets.length}, senses: ${senses.length}`);
        }
      } else {
        if (options.debug) {
          this.logger.debug(`Skipping duplicate handling - strategy is 'skip' or not configured`);
        }
        for (const w of pendingWords) words.push(w);
        for (const syn of pendingSynsets) synsets.push(syn);
        for (const s of pendingSensesGlobal) senses.push(s);
      }
    } else {
      if (lexiconElement.LexicalEntry) {
        for (const key in lexiconElement.LexicalEntry) {
          if (Object.prototype.hasOwnProperty.call(
            lexiconElement.LexicalEntry,
            key
          )) {
            const lexicalEntry = lexiconElement.LexicalEntry[key];
            const lexiconId = lexiconElement.id || "unknown";
            const word = this.processLexicalEntry(lexicalEntry, lexiconId);
            if (word) {
              if (includeIntoAggregates) {
                words.push(word);
              }
            } else {
              if (options.debug) {
                this.logger.warn(`No word found for LexicalEntry element:`, lexicalEntry);
              }
            }
            if (lexicalEntry.Sense) {
              for (const senseKey in lexicalEntry.Sense) {
                if (Object.prototype.hasOwnProperty.call(
                  lexicalEntry.Sense,
                  senseKey
                )) {
                  const sense = this.processSense(lexicalEntry.Sense[senseKey], lexicalEntry.id);
                  if (sense) {
                    if (includeIntoAggregates) {
                      senses.push(sense);
                    }
                  } else {
                    if (options.debug) {
                      this.logger.warn(`No sense found for Sense element:`, lexicalEntry.Sense[senseKey]);
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (lexiconElement.Synset) {
        for (const key in lexiconElement.Synset) {
          if (Object.prototype.hasOwnProperty.call(lexiconElement.Synset, key)) {
            const lexiconId = lexiconElement.id || "unknown";
            const synset = this.processSynset(lexiconElement.Synset[key], lexiconId);
            if (synset) {
              if (includeIntoAggregates) {
                synsets.push(synset);
              }
            } else {
              if (options.debug) {
                this.logger.warn(`No synset found for Synset element:`, lexiconElement.Synset[key]);
              }
            }
          }
        }
      }
      if (lexiconElement.Sense) {
        for (const key in lexiconElement.Sense) {
          if (Object.prototype.hasOwnProperty.call(lexiconElement.Sense, key)) {
            const sense = this.processSense(lexiconElement.Sense[key]);
            if (sense) {
              if (includeIntoAggregates) {
                senses.push(sense);
              }
            } else {
              if (options.debug) {
                this.logger.warn(`No sense found for Sense element:`, lexiconElement.Sense[key]);
              }
            }
          }
        }
      }
      if (includeIntoAggregates && options.duplicateHandling && options.duplicateHandling.strategy !== "skip") {
        if (options.debug) {
          this.logger.debug(`Applying duplicate handling to old structure with strategy: ${options.duplicateHandling.strategy}`);
        }
        const filteredWords = this.duplicateHandler.handleDuplicates(words, "words");
        const filteredSynsets = this.duplicateHandler.handleDuplicates(synsets, "synsets");
        const filteredSenses = this.duplicateHandler.handleDuplicates(senses, "senses");
        words.length = 0;
        synsets.length = 0;
        senses.length = 0;
        words.push(...filteredWords);
        synsets.push(...filteredSynsets);
        senses.push(...filteredSenses);
      }
    }
    if (options.debug) {
      this.logger.debug(`Lexicon contents processed:`, {
        words: words.length,
        synsets: synsets.length,
        senses: senses.length
      });
    }
    if (words.length > 0 || synsets.length > 0 || senses.length > 0) {
      this.logger.info("Lexicon contents processed", {
        words: words.length,
        synsets: synsets.length,
        senses: senses.length,
        includeIntoAggregates
      });
    }
  }
  /**
   * Process a Lexicon element
   * Returns a properly typed Lexicon with required fields filled
   */
  processLexicon(element) {
    if (!element) {
      this.logger.warn("processLexicon: element is null/undefined");
      return null;
    }
    if (typeof element !== "object") {
      this.logger.warn("processLexicon: element is not an object", {
        type: typeof element,
        value: element
      });
      return null;
    }
    let id;
    let label;
    let language;
    let version;
    let email;
    let license;
    let url;
    let citation;
    let logo;
    let requires = [];
    if (element.attributes) {
      this.logger.debug(`Processing lexicon with attributes:`, element.attributes);
      id = element.attributes.id;
      label = element.attributes.label;
      language = element.attributes.language;
      version = element.attributes.version;
      email = element.attributes.email;
      license = element.attributes.license;
      url = element.attributes.url;
      citation = element.attributes.citation;
      logo = element.attributes.logo;
    } else {
      this.logger.debug(`Processing lexicon with old structure:`, element);
      id = element.id;
      label = element.label;
      language = element.language;
      version = element.version;
      email = element.email;
      license = element.license;
      url = element.url;
      citation = element.citation;
      logo = element.logo;
    }
    if (element.children) {
      for (const child of element.children) {
        if (child.name === "Requires" && child.attributes) {
          const requiredId = child.attributes.id;
          const requiredVersion = child.attributes.version;
          if (requiredId) {
            const dependency = requiredVersion ? `${requiredId}:${requiredVersion}` : requiredId;
            requires.push(dependency);
            this.logger.debug(`Found lexicon dependency: ${dependency}`);
          }
        }
      }
    }
    if (!id) {
      this.logger.warn("processLexicon: missing ID", { element });
      return null;
    }
    const lexiconLanguage = language || "en";
    const lexicon = {
      id,
      label: label || "Unknown Lexicon",
      language: lexiconLanguage,
      url
    };
    if (version) lexicon.version = version;
    if (email) lexicon.email = email;
    if (license) lexicon.license = license;
    if (citation) lexicon.citation = citation;
    if (logo) lexicon.logo = logo;
    if (requires && requires.length > 0) lexicon.requires = requires;
    return lexicon;
  }
  /**
   * Process a LexicalEntry element
   */
  processLexicalEntry(element, lexiconId) {
    if (!element) {
      this.logger.warn("processLexicalEntry: element is null/undefined");
      return null;
    }
    if (typeof element !== "object") {
      this.logger.warn("processLexicalEntry: element is not an object", {
        type: typeof element,
        value: element
      });
      return null;
    }
    let id;
    let lemma;
    let partOfSpeech;
    let indexAttr;
    if (element.attributes) {
      id = element.attributes.id;
      indexAttr = element.attributes.index;
    } else {
      id = element.id;
      indexAttr = element.index;
    }
    if (!id) {
      this.logger.warn("processLexicalEntry: missing ID", { element });
      return null;
    }
    let lemmaElement;
    if (element.children && Array.isArray(element.children)) {
      lemmaElement = element.children.find(
        (child) => child.name === "Lemma"
      );
    } else {
      lemmaElement = element.Lemma;
    }
    if (lemmaElement) {
      const lemmaData = lemmaElement;
      if (lemmaData.attributes) {
        lemma = lemmaData.attributes.writtenForm;
        partOfSpeech = lemmaData.attributes.partOfSpeech;
      } else {
        lemma = lemmaData.writtenForm;
        partOfSpeech = lemmaData.partOfSpeech;
      }
    }
    lemma = lemma || id;
    partOfSpeech = partOfSpeech || "n";
    const forms = [];
    if (element.children && Array.isArray(element.children)) {
      const formElements = element.children.filter(
        (child) => child.name === "Form"
      );
      for (const formElement of formElements) {
        forms.push({
          id: formElement.attributes?.id || `${id}_form_${forms.length}`,
          writtenForm: formElement.attributes?.writtenForm || "",
          tag: formElement.attributes?.tag || "",
          script: formElement.attributes?.script
        });
      }
    } else if (element.Form) {
      for (const key in element.Form) {
        if (Object.prototype.hasOwnProperty.call(element.Form, key)) {
          const formData = element.Form[key];
          forms.push({
            id: key,
            writtenForm: formData.writtenForm || "",
            tag: formData.tag || "",
            script: formData.script
          });
        }
      }
    }
    const indexValue = indexAttr || lemma;
    return {
      id,
      lemma,
      pos: partOfSpeech,
      forms,
      pronunciations: [],
      tags: [],
      counts: [],
      language: "en",
      lexicon: lexiconId,
      // Use the passed lexicon ID instead of hardcoded "unknown"
      // optional index is used by 1.4 for deduplication and UI grouping
      ...indexValue ? { index: indexValue } : {}
    };
  }
  /**
   * Process a Synset element
   */
  processSynset(element, lexiconId) {
    if (!element) {
      this.logger.warn("processSynset: element is null/undefined");
      return null;
    }
    if (typeof element !== "object") {
      this.logger.warn("processSynset: element is not an object", {
        type: typeof element,
        value: element
      });
      return null;
    }
    this.stats.synsetsProcessed++;
    let id;
    let ili;
    let partOfSpeech;
    let language;
    let lexicon;
    if (element.attributes) {
      id = element.attributes.id;
      ili = element.attributes.ili;
      partOfSpeech = element.attributes.partOfSpeech;
      language = element.attributes.language;
      lexicon = element.attributes.lexicon;
    } else {
      id = element.id;
      ili = element.ili;
      partOfSpeech = element.partOfSpeech;
      language = element.language;
      lexicon = element.lexicon;
    }
    if (!id) {
      this.logger.warn("processSynset: missing ID", { element });
      return null;
    }
    const definitions = [];
    if (element.children && Array.isArray(element.children)) {
      const definitionElements = element.children.filter(
        (child) => child.name === "Definition"
      );
      if (definitionElements.length > 0) {
        this.stats.synsetsWithDefinitions++;
        this.stats.totalDefinitions += definitionElements.length;
      }
      for (const defElement of definitionElements) {
        let gloss = "";
        if (defElement.text) {
          gloss = defElement.text;
        } else if (defElement.children && Array.isArray(defElement.children)) {
          const glossElement = defElement.children.find(
            (child) => child.name === "gloss"
          );
          if (glossElement) {
            gloss = glossElement.text || "";
          } else {
            gloss = defElement.children.map((child) => child.text || "").filter(Boolean).join(" ");
          }
        }
        if (!gloss.trim()) {
          if (defElement.children && Array.isArray(defElement.children)) {
            for (const child of defElement.children) {
              if (child.text && child.text.trim()) {
                gloss = child.text;
                break;
              }
            }
          }
          if (!gloss.trim()) {
            gloss = "";
          }
        }
        const definitionText = gloss.trim();
        definitions.push({
          id: `${id}.def.${defElement.attributes?.language || "en"}`,
          language: defElement.attributes?.language || "en",
          text: definitionText,
          source: defElement.attributes?.source || ""
        });
        if (definitionText) {
          this.stats.definitionsWithText++;
        }
      }
    } else if (element.Definition) {
      for (const key in element.Definition) {
        if (Object.prototype.hasOwnProperty.call(element.Definition, key)) {
          const defElement = element.Definition[key];
          const glossElement = defElement.gloss;
          const gloss = glossElement?.textContent || defElement.textContent || "";
          definitions.push({
            id: `${id}.def.${defElement.language || "en"}`,
            language: defElement.language || "en",
            text: gloss.trim(),
            source: defElement.source || ""
          });
        }
      }
    }
    const relations = [];
    if (element.children && Array.isArray(element.children)) {
      const relationElements = element.children.filter(
        (child) => child.name === "SynsetRelation"
      );
      for (const relElement of relationElements) {
        relations.push({
          id: relElement.attributes?.id || `${id}.rel.${relations.length}`,
          type: relElement.attributes?.relType || "unknown",
          target: relElement.attributes?.target || "",
          source: relElement.attributes?.source,
          dcType: relElement.attributes?.dcType
        });
      }
    } else if (element.SynsetRelation) {
      for (const key in element.SynsetRelation) {
        if (Object.prototype.hasOwnProperty.call(element.SynsetRelation, key)) {
          const relation = element.SynsetRelation[key];
          relations.push({
            id: key,
            type: relation.relType || "unknown",
            target: relation.target || "",
            source: relation.source,
            dcType: relation.dcType
          });
        }
      }
    }
    return {
      id,
      ili: ili || void 0,
      pos: partOfSpeech || "n",
      definitions: definitions.length > 0 ? definitions : [],
      examples: [],
      relations: relations.length > 0 ? relations : [],
      language: language || "en",
      lexicon: lexicon || lexiconId,
      // Use passed lexicon ID as fallback instead of "unknown"
      memberIds: [],
      senseIds: []
    };
  }
  /**
   * Process a Sense element
   */
  processSense(element, lexicalEntryId) {
    if (!element) {
      this.logger.warn("processSense: element is null/undefined");
      return null;
    }
    if (typeof element !== "object") {
      this.logger.warn("processSense: element is not an object", {
        type: typeof element,
        value: element
      });
      return null;
    }
    let id;
    let synset;
    if (element.attributes) {
      id = element.attributes.id;
      synset = element.attributes.synset;
    } else {
      id = element.id;
      synset = element.synset;
    }
    if (!id) {
      this.logger.warn("processSense: missing ID", { element });
      return null;
    }
    if (!synset) {
      this.logger.warn("processSense: missing synset reference", {
        senseId: id,
        element
      });
      return null;
    }
    if (this.options.debug && this.options.verbose) {
      this.logger.debug(`Processing sense ${id}:`, {
        senseId: id,
        synsetId: synset,
        hasSynset: !!synset,
        lexicalEntryId,
        elementKeys: Object.keys(element),
        elementAttributes: element.attributes ? Object.keys(element.attributes) : "none"
      });
    }
    let wordId;
    if (lexicalEntryId) {
      wordId = lexicalEntryId;
    } else if (element.attributes?.word) {
      wordId = element.attributes.word;
    } else {
      wordId = id;
    }
    return {
      id,
      wordId,
      synsetId: synset,
      counts: [],
      examples: [],
      tags: []
    };
  }
  /**
   * Enhanced regex-based parsing fallback for when XML parser fails
   */
  parseWithEnhancedRegex(xmlContent, result, progressCallback, mergedOptions) {
    const options = mergedOptions || this.options;
    this.logger.warn(
      "parseWithEnhancedRegex: XML parser failed, using regex fallback",
      {
        contentLength: xmlContent.length,
        hasLexicalResource: xmlContent.includes("<LexicalResource"),
        hasLexicon: xmlContent.includes("<Lexicon"),
        hasLexicalEntry: xmlContent.includes("<LexicalEntry")
      }
    );
    if (options.debug && this.options.verbose) {
      this.logger.debug(
        `Starting enhanced regex parsing with ${xmlContent.length} characters`
      );
      this.logger.debug(`First 200 chars:`, xmlContent.substring(0, 200));
    }
    const attrs = (s) => {
      const out = {};
      const re = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
      let m;
      while ((m = re.exec(s)) !== null) out[m[1]] = m[2];
      return out;
    };
    progressCallback?.("regex_parsing", 0, 4, { stage: "lexicons" });
    const lexiconRe = /<Lexicon\b([^>]*)>([\s\S]*?)<\/Lexicon>/g;
    let lm;
    let lexiconCount = 0;
    while ((lm = lexiconRe.exec(xmlContent)) !== null) {
      lexiconCount++;
      const a = attrs(lm[1]);
      if (options.debug && this.options.verbose) {
        this.logger.debug(`Found lexicon:`, a);
      }
      const lexicon = {
        id: a.id || "unknown",
        label: a.label || "Unknown Lexicon",
        language: a.language || "en",
        url: a.url || void 0
      };
      if (a.version) lexicon.version = a.version;
      if (a.email) lexicon.email = a.email;
      if (a.license) lexicon.license = a.license;
      if (a.citation) lexicon.citation = a.citation;
      if (a.logo) lexicon.logo = a.logo;
      result.lexicons.push(lexicon);
    }
    progressCallback?.("regex_parsing", 1, 4, { stage: "words" });
    const entryRe = /<LexicalEntry\b([^>]*)>[\s\S]*?<Lemma\b([^>]*)\/>[\s\S]*?<\/LexicalEntry>/g;
    let em;
    let wordCount = 0;
    while ((em = entryRe.exec(xmlContent)) !== null) {
      wordCount++;
      const ea = attrs(em[1]);
      const la = attrs(em[2]);
      const beforeMatch = xmlContent.substring(0, em.index);
      const lastLexiconMatch = beforeMatch.match(/<Lexicon\b([^>]*)>/g);
      if (lastLexiconMatch) {
        const lastLexiconAttrs = attrs(lastLexiconMatch[lastLexiconMatch.length - 1]);
        const wordLanguage = lastLexiconAttrs.language || "en";
        if (options.debug) {
          this.logger.debug(`Found word:`, { entry: ea, lemma: la, language: wordLanguage });
        }
        result.words.push({
          id: ea.id || "unknown",
          lemma: la.writtenForm || ea.id || "unknown",
          pos: la.partOfSpeech || "n",
          forms: [],
          pronunciations: [],
          tags: [],
          counts: [],
          language: wordLanguage,
          lexicon: lastLexiconAttrs.id || "unknown"
        });
      }
    }
    progressCallback?.("regex_parsing", 2, 4, { stage: "synsets" });
    const synsetRe = /<Synset\b([^>]*)>([\s\S]*?)<\/Synset>/g;
    let sm;
    let synsetCount = 0;
    while ((sm = synsetRe.exec(xmlContent)) !== null) {
      synsetCount++;
      const sa = attrs(sm[1]);
      const body = sm[2];
      let defLang = "en";
      let defText = "";
      const defRe = /<Definition\b([^>]*)>([\s\S]*?)<\/Definition>/;
      const dm = defRe.exec(body);
      if (dm) {
        const da = attrs(dm[1]);
        defLang = da.language || "en";
        const glossM = /<gloss>([\s\S]*?)<\/gloss>/.exec(dm[2]);
        defText = (glossM ? glossM[1] : dm[2]).trim();
      }
      const beforeMatch = xmlContent.substring(0, sm.index);
      const lastLexiconMatch = beforeMatch.match(/<Lexicon\b([^>]*)>/g);
      if (lastLexiconMatch) {
        const lastLexiconAttrs = attrs(lastLexiconMatch[lastLexiconMatch.length - 1]);
        const synsetLanguage = lastLexiconAttrs.language || "en";
        if (options.debug) {
          this.logger.debug(`Found synset:`, {
            synset: sa,
            definition: defText,
            language: synsetLanguage
          });
        }
        result.synsets.push({
          id: sa.id || "unknown",
          ili: sa.ili || void 0,
          pos: sa.partOfSpeech || "n",
          definitions: defText ? [
            {
              id: `${sa.id || "syn"}.def.${defLang}`,
              language: defLang,
              text: defText,
              source: ""
            }
          ] : [],
          examples: [],
          relations: [],
          language: synsetLanguage,
          lexicon: lastLexiconAttrs.id || "unknown",
          memberIds: [],
          senseIds: []
        });
      }
    }
    progressCallback?.("regex_parsing", 3, 4, { stage: "senses" });
    const senseRe = /<Sense\b([^>]*)\/>|<Sense\b([^>]*)><\/Sense>/g;
    let snm;
    let senseCount = 0;
    while ((snm = senseRe.exec(xmlContent)) !== null) {
      senseCount++;
      const sa = attrs(snm[1] || snm[2] || "");
      if (!sa.id) continue;
      const beforeMatch = xmlContent.substring(0, snm.index);
      const lastLexiconMatch = beforeMatch.match(/<Lexicon\b([^>]*)>/g);
      if (lastLexiconMatch) {
        const lastLexiconAttrs = attrs(lastLexiconMatch[lastLexiconMatch.length - 1]);
        const senseLanguage = lastLexiconAttrs.language || "en";
        if (senseLanguage === "en") {
          if (options.debug) {
            this.logger.debug(`Found English sense:`, { ...sa, language: senseLanguage });
          }
          result.senses.push({
            id: sa.id,
            wordId: sa.word || sa.id,
            synsetId: sa.synset || sa.id,
            counts: [],
            examples: [],
            tags: []
          });
        } else {
          if (options.debug) {
            this.logger.debug(`Skipping non-English sense:`, { ...sa, language: senseLanguage });
          }
        }
      }
    }
    if (options.debug) {
      this.logger.debug(`Enhanced regex parsing completed:`, {
        lexicons: lexiconCount,
        words: wordCount,
        synsets: synsetCount,
        senses: senseCount
      });
    }
    progressCallback?.("regex_parsing", 4, 4, {
      stage: "completed",
      lexicons: result.lexicons.length,
      words: result.words.length,
      synsets: result.synsets.length,
      senses: result.senses.length
    });
    this.logger.debug("Enhanced regex parsing completed", {
      lexicons: result.lexicons.length,
      words: result.words.length,
      synsets: result.synsets.length,
      senses: result.senses.length
    });
  }
  /**
   * Clean up resources
   */
  destroy() {
    if (this.warningAggregator) {
      const aggregatedWarnings = this.warningAggregator.flush();
      if (aggregatedWarnings.totalWarnings > 0) {
        this.logger.warn("Parser destroyed with aggregated warnings", aggregatedWarnings);
      }
      this.warningAggregator.destroy();
    }
    if (this.duplicateHandler) {
      this.duplicateHandler.resetStatistics();
    }
  }
}
async function parseLMFXML(xmlText, options = {}) {
  const parser = new LmfParser(xmlText, options);
  return parser.parse(xmlText, { debug: options.debug });
}
export {
  LmfParser,
  parseLMFXML
};
//# sourceMappingURL=lmf-parser-D4YhhYZL.js.map

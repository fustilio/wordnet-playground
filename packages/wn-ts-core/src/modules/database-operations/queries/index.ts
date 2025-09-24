export {
  getWordsQuery,
  getWordByIdQuery,
  getWordsBySynsetAndLanguageQuery,
  getWordsByIliAndLanguageQuery,
  getWordsByIliAndLexiconPrefixQuery,
  getWordsByLexiconQuery,
  getWordsByIdsQuery,
  getWordsByFormFastQuery,
  getWordsByFormFuzzyFastQuery,
} from './words-queries.js';
export {
  getSensesQuery,
  getSenseByIdQuery,
  getSensesByWordIdQuery,
  getSensesBySynsetIdQuery,
} from './senses-queries.js';
export {
  getSynsetsV2Query,
  getSynsetsV3Query,
  getSynsetsV4Query,
  getSynsetsV5Query,
  getSynsetsV6Query,
  getSynsetsFastQuery,
  getSynsetsByFormFastQuery,
  getSynsetsByLexiconQuery,
  getSynsetByIdQuery,
  getSynsetsByIliQuery,
} from './synsets-queries.js';
export { getDefinitionsBySynsetIdQuery } from './definitions-queries.js';
export { getLexiconsQuery, getLexiconByIdQuery } from './lexicons-queries.js';
export { getIliByIdQuery, getIlisQuery } from './ilis-queries.js';
export { getRelationsBySynsetIdQuery } from './relations-queries.js';
export { getExamplesBySynsetIdQuery } from './examples-queries.js';
export { getFormsByWordIdQuery } from './forms-queries.js';
export { getStatisticsQueries } from './statistics-queries.js';
export {
  getBatchDefinitionsQuery,
  getBatchExamplesQuery,
  getBatchRelationsQuery,
  getBatchSensesQuery,
  getSensesBySynsetIdForTransformationQuery,
  getSensesBySynsetIdAllQuery,
} from './batch-queries.js';

import Conf from 'conf';
import { config as wnTsConfig } from 'wn-ts';
import { homedir } from 'os';
import { join } from 'path';

// Get default data directory from wn-ts itself
const defaultDataDir = join(homedir(), '.wn_ts_data');

// Define the schema for our configuration
const schema = {
  dataDirectory: {
    type: 'string',
    default: defaultDataDir,
  },
  allowMultithreading: {
    type: 'boolean',
    default: false,
  },
  enableUsageLogging: {
    type: 'boolean',
    default: false,
  },
};

// Create a Conf instance
const conf = new Conf({
  projectName: 'wn-cli',
  schema,
});

// Function to apply the stored config to the wn-ts config object
export function applyStoredConfig() {
  // During tests, config.dataDirectory is managed by the test-helper.
  // We should not override it with a persisted value from a previous test run.
  if (process.env.NODE_ENV !== 'test') {
    wnTsConfig.dataDirectory = conf.get('dataDirectory') as string;
  }
  wnTsConfig.allowMultithreading = conf.get('allowMultithreading') as boolean;
}

// Function to reset the config to its default values
export function resetConfig() {
    conf.clear();
    // Re-apply defaults after clearing
    applyStoredConfig();
}

export default conf;

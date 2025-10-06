import { createWordnet } from 'wn-ts-node';

// Create WordNet instance (downloads data on first run)
const wn = createWordnet('oewn:2024');
await wn.initialize();

// Search for synsets
const synsets = await wn.synsets('computer');

// Print results
console.log(`Found ${synsets.length} synsets for "computer":\n`);
synsets.slice(0, 3).forEach((s, i) => {
  console.log(`${i + 1}. ${s.id} (${s.pos})`);
  console.log(`   ${s.definitions[0]?.text || 'No definition'}\n`);
});

await wn.close();


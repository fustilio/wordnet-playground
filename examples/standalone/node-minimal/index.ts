import { createWordnet } from 'wn-ts-node';

async function main() {
  const wn = createWordnet('oewn:2024');
  
  try {
    await wn.initialize();
    
    const synsets = await wn.synsets('computer');
    console.log(`\nFound ${synsets.length} synsets for "computer":\n`);
    
    synsets.slice(0, 3).forEach((s, i) => {
      console.log(`${i + 1}. ${s.id} (${s.pos})`);
      console.log(`   ${s.definitions[0]?.text || 'No definition'}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await wn.close();
  }
}

main();


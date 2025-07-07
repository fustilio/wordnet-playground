# wn-ts Demo

A simple Node.js demo application that demonstrates live WordNet downloads and usage using the `wn-ts` library.

## Features

This demo showcases:

- 📋 **Project Discovery**: Lists available WordNet projects from the index
- 🔄 **Live Downloads**: Downloads real WordNet data from the internet
- 🔍 **Data Querying**: Searches for words and synsets in downloaded data
- 📊 **Project Information**: Shows metadata about available projects

## Usage

### Prerequisites

Make sure you have the workspace dependencies installed and the latest build of `wn-ts`:

```bash
pnpm install
pnpm --filter wn-ts build
```

### Running the Demo

From the workspace root:

```bash
# Build and run the demo
pnpm build:demo
pnpm start:demo
```

From the demo directory:

```bash
cd demo
pnpm start
```

### What the Demo Does

1. **Lists Available Projects**: Shows the first 5 available WordNet projects from the index
2. **Downloads CILI**: Downloads the Collaborative Interlingual Index (small file, good for testing)
3. **Downloads Open English WordNet**: Downloads the full Open English WordNet 2024
4. **Queries Data**: Searches for words like "information" and "computer" in the downloaded data
5. **Shows Project Info**: Displays metadata about the downloaded projects

### Data Storage

The demo uses a separate data directory (`~/.wn_demo`) to avoid interfering with your main WordNet data. Downloaded files are cached, so subsequent runs will be faster.

### Customization

You can modify `src/demo.js` to:

- Download different projects
- Query different words
- Test other library features
- Add more complex queries

### Troubleshooting

- **Build Issues**: Make sure `wn-ts` is built before running the demo.
- **Network Issues**: The demo requires internet access to download WordNet data.
- **Large Downloads**: Some WordNet files are quite large (100MB+), so downloads may take time.
- **Disk Space**: Ensure you have sufficient disk space for downloaded data.
- **Permissions**: Make sure the demo has write permissions to create the data directory.
- **Cache**: If you want to clear cached downloads, delete the `~/.wn_demo` directory.

## Expected Output

```
🌐 wn-ts Live Demo
==================

📁 Using data directory: /home/user/.wn_demo

📋 Available WordNet Projects:
  • cili:1.0 - Collaborative Interlingual Index (---)
  • oewn:2024 - Open English WordNet (en)
  • oewn:2023 - Open English WordNet (en)
  • oewn:2022 - Open English WordNet (en)
  • oewn:2021 - Open English WordNet (en)
  ... and 50+ more projects

🔄 Demo 1: Downloading CILI (Collaborative Interlingual Index)...
✅ CILI downloaded successfully!

🔄 Demo 2: Downloading Open English WordNet (2024)...
✅ Open English WordNet downloaded successfully!

🔍 Demo 3: Querying downloaded data...

📝 Searching for words containing "information":
  • information (n)
  • informational (a)
  • inform (v)

📚 Getting synsets for "information":
  • oewn-00000001-n - knowledge communicated or received concerning a particular fact or circumstance
  • oewn-00000002-n - a message received and understood

📝 Searching for words containing "computer":
  • computer (n)
  • computing (n)
  • compute (v)

📊 Demo 4: Project Information:
  • Project: Open English WordNet
  • Language: en
  • License: https://creativecommons.org/licenses/by/4.0/
  • Download URLs: 2 available

🎉 Demo completed!

💡 Try running this demo again to see cached downloads in action.
💡 You can also try other projects like:
   • omw-en:1.4 (OMW English WordNet)
   • odenet:1.4 (Open German WordNet)
   • omw-fr:1.4 (French WordNet)
```

## Data Storage

The demo uses a separate data directory (`~/.wn_demo`) to avoid interfering with your main WordNet data. Downloaded files are cached, so subsequent runs will be faster.

## Customization

You can modify `src/demo.js` to:

- Download different projects
- Query different words
- Test other library features
- Add more complex queries

## Troubleshooting

- **Network Issues**: The demo requires internet access to download WordNet data
- **Large Downloads**: Some WordNet files are quite large (100MB+), so downloads may take time
- **Disk Space**: Ensure you have sufficient disk space for downloaded data
- **Permissions**: Make sure the demo has write permissions to create the data directory 
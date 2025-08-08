# WordNet TypeScript Web Demo

An interactive browser demo for the `wn-ts` ecosystem, showcasing `wn-ts-web` with SQLite WASM, persistent storage via OPFS, and real-time data exploration.

## 🌟 Status: ✅ Fully Functional

This demo is a comprehensive showcase of `wn-ts-web` capabilities, featuring:

- ✅ **SQLite WASM Integration**: High-performance database operations in the browser.
- ✅ **Persistent Storage**: Utilizes the Origin Private File System (OPFS) for data persistence.
- ✅ **Real-time Statistics**: Live updates on system status, database statistics, and storage.
- ✅ **Structured Demo Pages**:
    - **Basic**: Simple interface for word, synset, and sense lookups.
    - **Advanced**: Tools for loading WordNet packages and managing database import/export.
    - **Developer**: Utilities for inspecting cache and managing OPFS storage.
- ✅ **Modern UI**: Built with React and styled with Tailwind CSS for a responsive experience.
- ✅ **CORS Proxy**: Built-in proxy for downloading external WordNet data during local development.

## 🚀 Quick Start

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```
2.  **Start the development server**:
    ```bash
    pnpm dev
    ```
3.  Open your browser to `http://localhost:5173`.

## ✨ Features

The demo is organized into three main tabs, each offering a different level of interaction with the WordNet API.

### Basic Demo
A straightforward interface for new users to start exploring WordNet.
- **Search**: Look up words, synsets, or senses.
- **View Results**: See raw JSON output from the API.

### Advanced Demo
For users who want to manage WordNet data packages.
- **Load Packages**: Dynamically load available WordNet projects (e.g., OEWN, CILI).
- **Export Database**: Download the current SQLite database as a file.
- **Import Database**: Load a previously exported `.db` file.

### Developer Demo
Tools for developers to inspect the inner workings of `wn-ts-web`.
- **Cache Inspection**: View details about browser storage (`localStorage`, `sessionStorage`, `IndexedDB`).
- **Data Management**: Clear all data from the database or OPFS.
- **OPFS Snapshot**: Save the current database state to a new file in OPFS for testing.

### Status Widgets
On the side, you'll find real-time information about the system:
- **System Status**: Tracks initialization, loading progress, and errors.
- **Database Statistics**: Displays totals for words, synsets, and senses, plus part-of-speech distribution.
- **OPFS Status**: Shows whether OPFS is supported and provides a breakdown of storage usage.

## 🔧 Development

### Scripts
- `pnpm dev`: Start the development server.
- `pnpm build`: Build the application for production.
- `pnpm test`: Run the browser-based test suite.

### Project Structure
```
wn-ts-web-demo/
└── src/
    ├── App.tsx             # Main application component and layout
    ├── main.tsx            # Application entry point
    ├── components/
    │   ├── demos/          # Components for each demo tab (Basic, Advanced, etc.)
    │   ├── shared/         # Reusable components (Card, Tabs)
    │   └── widgets/        # Components for the status sidebar
    ├── hooks/              # Custom React hooks for state management
    └── utils/              # Utility functions
```

## 🧪 Testing
The demo includes comprehensive Cypress tests focused on **real WordNet data validation**, **search functionality**, and **CILI integration** rather than just UI elements.

### Test Categories
- **Data Loading & Statistics**: Validates actual WordNet data loading with real statistics (100k+ words, 100k+ synsets, 200k+ senses)
- **WordNet Search**: Tests search functionality with multiple words ('run', 'happy', 'computer', 'book') and validates JSON structure
- **CILI Integration**: Tests Collaborative Interlingual Index package loading and cross-lingual data access
- **Package Management**: Validates OEWN 2024 and CILI 1.0 package loading and integration

### Running Tests
```bash
# Run WordNet-specific tests (recommended)
pnpm test:cypress

# Run all Cypress tests (including examples)
pnpm test:cypress:all

# Run example tests only
pnpm test:cypress:examples
```

### Test Features
- **Comprehensive Logging**: Extensive use of `cy.log()` to track data loading, search results, and validation
- **Real Data Validation**: Tests actual WordNet statistics and search results
- **Edge Case Testing**: Empty searches, long words, network failures
- **Performance Monitoring**: Tracks data loading times and search response performance

For detailed testing methodology, see [TESTING_METHODOLOGY.md](./TESTING_METHODOLOGY.md).

## 🤝 Contributing
Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License
This project is licensed under the MIT License.

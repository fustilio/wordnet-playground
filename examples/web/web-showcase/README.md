# wn-ts-web Showcase

A comprehensive showcase application demonstrating the capabilities of the wn-ts-web library. This React application features multiple interactive demos that highlight different aspects of WordNet functionality.

## Features

### 🎯 Interactive Demos
- **Basic Search**: Simple word definitions and examples
- **Advanced Search**: Search with part-of-speech filtering and detailed analysis
- **Synonyms & Antonyms**: Explore word relationships and semantic networks
- **Word Relationships**: Hierarchical relationships and semantic analysis

### 🎨 Modern UI
- Clean, responsive sidebar navigation
- Professional styling with Tailwind-inspired design
- Interactive components with loading states
- Mobile-friendly layout

### ⚡ Technical Features
- React Router for client-side navigation
- TypeScript for type safety
- Vite for fast development and building
- Web Workers support via wn-ts-web

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── DemoPage.tsx    # Demo page wrapper
├── demos/              # Individual demo pages
│   ├── BasicSearchDemo.tsx
│   ├── AdvancedSearchDemo.tsx
│   ├── SynonymAntonymDemo.tsx
│   └── WordRelationshipsDemo.tsx
├── hooks/              # Custom React hooks
│   └── useWordnet.ts   # WordNet integration hook
├── config/             # Configuration files
│   └── demos.ts        # Demo configuration
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Demo Pages

### 1. Basic Search
- Simple word lookup functionality
- Displays definitions, examples, and synset information
- Perfect for getting started with wn-ts-web

### 2. Advanced Search
- Part-of-speech filtering
- Results summary with counts
- Enhanced table display with examples

### 3. Synonyms & Antonyms
- Word relationship exploration
- Synset-based organization
- Semantic network visualization

### 4. Word Relationships
- Hierarchical relationship analysis
- Semantic feature extraction
- Advanced WordNet concepts

## Customization

### Adding New Demos

1. Create a new demo component in `src/demos/`
2. Add the demo configuration to `src/config/demos.ts`
3. The demo will automatically appear in the sidebar

### Styling

The application uses custom CSS with a design system inspired by Tailwind CSS. Key classes:
- `.app-layout`: Main application layout
- `.sidebar`: Fixed sidebar navigation
- `.demo-page`: Individual demo page wrapper
- `.demo-section`: Content sections within demos

## Dependencies

- **React 18+**: UI framework
- **React Router DOM**: Client-side routing
- **wn-ts-web**: WordNet TypeScript library
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety

## Browser Support

- Chrome 107+
- Firefox 104+
- Safari 16+
- Edge 107+

## Contributing

This showcase is part of the wn-ts project. Please refer to the main project documentation for contribution guidelines.

## License

Same as the main wn-ts project.

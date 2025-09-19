import { BasicSearchDemo } from '../demos/BasicSearchDemo';
import { AdvancedSearchDemo } from '../demos/AdvancedSearchDemo';
import { SynonymAntonymDemo } from '../demos/SynonymAntonymDemo';
import { WordRelationshipsDemo } from '../demos/WordRelationshipsDemo';

export interface DemoConfig {
  id: string;
  title: string;
  description: string;
  path: string;
  component: React.ComponentType;
}

export const demos: DemoConfig[] = [
  {
    id: 'basic-search',
    title: 'Basic Search',
    description: 'Simple word definitions and examples',
    path: '/',
    component: BasicSearchDemo
  },
  {
    id: 'advanced-search',
    title: 'Advanced Search',
    description: 'Search with filters and detailed analysis',
    path: '/advanced',
    component: AdvancedSearchDemo
  },
  {
    id: 'synonyms-antonyms',
    title: 'Synonyms & Antonyms',
    description: 'Explore word relationships and semantic networks',
    path: '/synonyms',
    component: SynonymAntonymDemo
  },
  {
    id: 'word-relationships',
    title: 'Word Relationships',
    description: 'Hierarchical relationships and semantic analysis',
    path: '/relationships',
    component: WordRelationshipsDemo
  }
];

export const getDemoByPath = (path: string): DemoConfig | undefined => {
  return demos.find(demo => demo.path === path);
};

export const getDemoById = (id: string): DemoConfig | undefined => {
  return demos.find(demo => demo.id === id);
};

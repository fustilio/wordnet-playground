import { useState, useEffect } from "react";
import categoriesData from "./data/categories.json";
import './index.css';

const categories = categoriesData as Record<string, string[]>;

function App() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Log state changes properly
  useEffect(() => {
    console.log('Selected topic changed to:', selectedTopic);
  }, [selectedTopic]);
  const topicsArr = Object.keys(categories);
  return (<div>
    <div className="grid-container">
      {topicsArr.map((item) => (
        <div
          key={item}
          className={`box ${selectedTopic === item ? 'selected' : ''}`}
          onClick={() => setSelectedTopic(item)}
        >
          {item.replace(/_/g, ' ')}
        </div>
      ))}

    </div>
    <div className="center">
      <div className="button">
        Go
      </div>
    </div>
  </div>
  );
}


export default App;

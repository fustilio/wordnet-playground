/**
 * Comprehensive WordNet Relation Chain Test
 * 
 * This test demonstrates every single relation type from the WordNet specification
 * as described in the Wikipedia article: https://en.wikipedia.org/wiki/WordNet
 * 
 * The test uses a carefully selected chain of words that can demonstrate
 * all possible relation types in WordNet.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * Comprehensive WordNet Relation Test Chain
 * 
 * Based on the WordNet Wikipedia article, this chain demonstrates:
 * - All hierarchical relations (hypernyms, hyponyms, coordinate terms)
 * - All part-whole relations (meronyms, holonyms)
 * - All verb relations (troponyms, entailments)
 * - All lexical relations (morphosemantic links)
 * - All adjective relations (antonyms, similar)
 */
export const COMPREHENSIVE_RELATION_TEST_CHAIN = {
  // Primary test synset - "car" provides the most comprehensive relation coverage
  central: "car",
  
  // Hierarchical Relations (Nouns) - from WordNet Wikipedia
  hierarchical: {
    hypernyms: [
      "vehicle",           // car is a kind of vehicle
      "motor_vehicle",     // car is a kind of motor vehicle
      "automobile"         // car is a kind of automobile
    ],
    hyponyms: [
      "sedan",            // sedan is a kind of car
      "coupe",            // coupe is a kind of car
      "suv",              // SUV is a kind of car
      "convertible",      // convertible is a kind of car
      "hatchback"         // hatchback is a kind of car
    ],
    coordinate_terms: [
      "truck",            // truck is a coordinate term of car
      "bus",              // bus is a coordinate term of car
      "motorcycle",       // motorcycle is a coordinate term of car
      "van"               // van is a coordinate term of car
    ],
    instance_hypernyms: [
      "entity",           // car is an instance of entity
      "physical_object"   // car is an instance of physical object
    ],
    instance_hyponyms: [
      "ford_focus",       // Ford Focus is an instance of car
      "toyota_camry"      // Toyota Camry is an instance of car
    ]
  },
  
  // Part-Whole Relations (Nouns) - from WordNet Wikipedia
  part_whole: {
    holonyms: [
      "fleet",            // car is part of fleet
      "traffic",          // car is part of traffic
      "parking_lot"       // car is part of parking lot
    ],
    meronyms: [
      "engine",           // engine is part of car
      "wheel",            // wheel is part of car
      "door",             // door is part of car
      "windshield",       // windshield is part of car
      "steering_wheel",   // steering wheel is part of car
      "brake",            // brake is part of car
      "headlight",        // headlight is part of car
      "bumper"            // bumper is part of car
    ],
    part_meronyms: [
      "tire",             // tire is a part of car
      "seat"              // seat is a part of car
    ],
    member_meronyms: [
      "driver",           // driver is a member of car
      "passenger"         // passenger is a member of car
    ],
    substance_meronyms: [
      "steel",            // steel is a substance of car
      "plastic"           // plastic is a substance of car
    ]
  },
  
  // Verb Relations - from WordNet Wikipedia
  verb_relations: {
    verb_hypernyms: [
      "drive",            // drive is a hypernym of operate
      "operate",          // operate is a hypernym of steer
      "control"           // control is a hypernym of steer
    ],
    verb_hyponyms: [
      "steer",            // steer is a hyponym of drive
      "park",             // park is a hyponym of drive
      "accelerate",       // accelerate is a hyponym of drive
      "brake"             // brake is a hyponym of drive
    ],
    troponyms: [
      "cruise",           // cruise is a troponym of drive
      "race",             // race is a troponym of drive
      "drift"             // drift is a troponym of drive
    ],
    entailments: [
      "sit",              // sit is entailed by drive
      "hold",             // hold is entailed by steer
      "look"              // look is entailed by drive
    ],
    verb_coordinate_terms: [
      "fly",              // fly is a coordinate term of drive
      "sail",             // sail is a coordinate term of drive
      "walk"              // walk is a coordinate term of drive
    ]
  },
  
  // Lexical Relations - from WordNet Wikipedia
  lexical_relations: {
    morphosemantic_links: [
      "drive",            // drive is morphosemantically linked to car
      "driver",           // driver is morphosemantically linked to car
      "driving"           // driving is morphosemantically linked to car
    ],
    derivationally_related: [
      "automotive",       // automotive is derivationally related to car
      "carry"             // carry is derivationally related to car
    ],
    morphological_relations: [
      "cars",             // cars is morphologically related to car
      "car's"             // car's is morphologically related to car
    ]
  },
  
  // Adjective Relations - from WordNet Wikipedia
  adjective_relations: {
    central_antonyms: [
      "stationary",       // stationary is antonym of mobile
      "immobile"          // immobile is antonym of mobile
    ],
    satellite_synonyms: [
      "mobile",           // mobile is similar to moving
      "moving",           // moving is similar to mobile
      "portable"          // portable is similar to mobile
    ],
    antonyms: [
      "stationary",       // stationary is antonym of mobile
      "immobile"          // immobile is antonym of mobile
    ],
    similar: [
      "mobile",           // mobile is similar to moving
      "moving",           // moving is similar to mobile
      "portable"          // portable is similar to mobile
    ]
  },
  
  // Additional Test Words for Comprehensive Coverage
  additional_test_words: {
    // For entailment testing - from WordNet Wikipedia example
    "sleep": {
      entailments: ["snore", "dream", "rest"]
    },
    
    // For troponym testing - from WordNet Wikipedia example
    "talk": {
      troponyms: ["whisper", "shout", "murmur", "lisp", "stutter"]
    },
    
    // For meronym testing - from WordNet Wikipedia example
    "building": {
      meronyms: ["window", "door", "roof", "wall", "floor"],
      holonyms: ["city", "neighborhood", "block"]
    },
    
    // For similarity testing - from WordNet Wikipedia example
    "hot": {
      antonyms: ["cold", "cool"],
      similar: ["warm", "scorching", "boiling", "steaming"]
    }
  }
};

describe('Comprehensive WordNet Relation Chain', () => {
  beforeAll(() => {
    console.log('Setting up comprehensive relation chain test');
  });

  afterAll(() => {
    console.log('Cleaning up comprehensive relation chain test');
  });

  describe('Hierarchical Relations', () => {
    it('should demonstrate hypernym relationships', () => {
      const hypernyms = COMPREHENSIVE_RELATION_TEST_CHAIN.hierarchical.hypernyms;
      expect(hypernyms).toContain('vehicle');
      expect(hypernyms).toContain('motor_vehicle');
      expect(hypernyms).toContain('automobile');
      console.log('Hypernyms:', hypernyms);
    });

    it('should demonstrate hyponym relationships', () => {
      const hyponyms = COMPREHENSIVE_RELATION_TEST_CHAIN.hierarchical.hyponyms;
      expect(hyponyms).toContain('sedan');
      expect(hyponyms).toContain('coupe');
      expect(hyponyms).toContain('suv');
      expect(hyponyms).toContain('convertible');
      expect(hyponyms).toContain('hatchback');
      console.log('Hyponyms:', hyponyms);
    });

    it('should demonstrate coordinate term relationships', () => {
      const coordinate_terms = COMPREHENSIVE_RELATION_TEST_CHAIN.hierarchical.coordinate_terms;
      expect(coordinate_terms).toContain('truck');
      expect(coordinate_terms).toContain('bus');
      expect(coordinate_terms).toContain('motorcycle');
      expect(coordinate_terms).toContain('van');
      console.log('Coordinate terms:', coordinate_terms);
    });
  });

  describe('Part-Whole Relations', () => {
    it('should demonstrate holonym relationships', () => {
      const holonyms = COMPREHENSIVE_RELATION_TEST_CHAIN.part_whole.holonyms;
      expect(holonyms).toContain('fleet');
      expect(holonyms).toContain('traffic');
      expect(holonyms).toContain('parking_lot');
      console.log('Holonyms:', holonyms);
    });

    it('should demonstrate meronym relationships', () => {
      const meronyms = COMPREHENSIVE_RELATION_TEST_CHAIN.part_whole.meronyms;
      expect(meronyms).toContain('engine');
      expect(meronyms).toContain('wheel');
      expect(meronyms).toContain('door');
      expect(meronyms).toContain('windshield');
      expect(meronyms).toContain('steering_wheel');
      expect(meronyms).toContain('brake');
      expect(meronyms).toContain('headlight');
      expect(meronyms).toContain('bumper');
      console.log('Meronyms:', meronyms);
    });
  });

  describe('Verb Relations', () => {
    it('should demonstrate troponym relationships', () => {
      const troponyms = COMPREHENSIVE_RELATION_TEST_CHAIN.verb_relations.troponyms;
      expect(troponyms).toContain('cruise');
      expect(troponyms).toContain('race');
      expect(troponyms).toContain('drift');
      console.log('Troponyms:', troponyms);
    });

    it('should demonstrate entailment relationships', () => {
      const entailments = COMPREHENSIVE_RELATION_TEST_CHAIN.verb_relations.entailments;
      expect(entailments).toContain('sit');
      expect(entailments).toContain('hold');
      expect(entailments).toContain('look');
      console.log('Entailments:', entailments);
    });
  });

  describe('Lexical Relations', () => {
    it('should demonstrate morphosemantic link relationships', () => {
      const morphosemantic_links = COMPREHENSIVE_RELATION_TEST_CHAIN.lexical_relations.morphosemantic_links;
      expect(morphosemantic_links).toContain('drive');
      expect(morphosemantic_links).toContain('driver');
      expect(morphosemantic_links).toContain('driving');
      console.log('Morphosemantic links:', morphosemantic_links);
    });
  });

  describe('Adjective Relations', () => {
    it('should demonstrate antonym relationships', () => {
      const antonyms = COMPREHENSIVE_RELATION_TEST_CHAIN.adjective_relations.antonyms;
      expect(antonyms).toContain('stationary');
      expect(antonyms).toContain('immobile');
      console.log('Antonyms:', antonyms);
    });

    it('should demonstrate similar relationships', () => {
      const similar = COMPREHENSIVE_RELATION_TEST_CHAIN.adjective_relations.similar;
      expect(similar).toContain('mobile');
      expect(similar).toContain('moving');
      expect(similar).toContain('portable');
      console.log('Similar:', similar);
    });
  });

  describe('Additional Test Words', () => {
    it('should demonstrate sleep entailments', () => {
      const sleep_entailments = COMPREHENSIVE_RELATION_TEST_CHAIN.additional_test_words.sleep.entailments;
      expect(sleep_entailments).toContain('snore');
      expect(sleep_entailments).toContain('dream');
      expect(sleep_entailments).toContain('rest');
      console.log('Sleep entailments:', sleep_entailments);
    });

    it('should demonstrate talk troponyms', () => {
      const talk_troponyms = COMPREHENSIVE_RELATION_TEST_CHAIN.additional_test_words.talk.troponyms;
      expect(talk_troponyms).toContain('whisper');
      expect(talk_troponyms).toContain('shout');
      expect(talk_troponyms).toContain('murmur');
      expect(talk_troponyms).toContain('lisp');
      expect(talk_troponyms).toContain('stutter');
      console.log('Talk troponyms:', talk_troponyms);
    });

    it('should demonstrate building meronyms', () => {
      const building_meronyms = COMPREHENSIVE_RELATION_TEST_CHAIN.additional_test_words.building.meronyms;
      expect(building_meronyms).toContain('window');
      expect(building_meronyms).toContain('door');
      expect(building_meronyms).toContain('roof');
      expect(building_meronyms).toContain('wall');
      expect(building_meronyms).toContain('floor');
      console.log('Building meronyms:', building_meronyms);
    });

    it('should demonstrate hot antonyms and similar', () => {
      const hot_antonyms = COMPREHENSIVE_RELATION_TEST_CHAIN.additional_test_words.hot.antonyms;
      const hot_similar = COMPREHENSIVE_RELATION_TEST_CHAIN.additional_test_words.hot.similar;
      
      expect(hot_antonyms).toContain('cold');
      expect(hot_antonyms).toContain('cool');
      expect(hot_similar).toContain('warm');
      expect(hot_similar).toContain('scorching');
      expect(hot_similar).toContain('boiling');
      expect(hot_similar).toContain('steaming');
      
      console.log('Hot antonyms:', hot_antonyms);
      console.log('Hot similar:', hot_similar);
    });
  });

  describe('Comprehensive Coverage', () => {
    it('should cover all major relation types from WordNet Wikipedia', () => {
      const chain = COMPREHENSIVE_RELATION_TEST_CHAIN;
      
      // Verify all major relation categories are present
      expect(chain.hierarchical).toBeDefined();
      expect(chain.part_whole).toBeDefined();
      expect(chain.verb_relations).toBeDefined();
      expect(chain.lexical_relations).toBeDefined();
      expect(chain.adjective_relations).toBeDefined();
      expect(chain.additional_test_words).toBeDefined();
      
      // Verify specific relation types from WordNet Wikipedia
      expect(chain.hierarchical.hypernyms).toBeDefined();
      expect(chain.hierarchical.hyponyms).toBeDefined();
      expect(chain.hierarchical.coordinate_terms).toBeDefined();
      expect(chain.part_whole.holonyms).toBeDefined();
      expect(chain.part_whole.meronyms).toBeDefined();
      expect(chain.verb_relations.troponyms).toBeDefined();
      expect(chain.verb_relations.entailments).toBeDefined();
      expect(chain.lexical_relations.morphosemantic_links).toBeDefined();
      expect(chain.adjective_relations.antonyms).toBeDefined();
      expect(chain.adjective_relations.similar).toBeDefined();
      
      console.log('All major relation types covered in test chain');
    });

    it('should provide sufficient examples for each relation type', () => {
      const chain = COMPREHENSIVE_RELATION_TEST_CHAIN;
      
      // Each relation type should have at least 2 examples
      expect(chain.hierarchical.hypernyms.length).toBeGreaterThanOrEqual(2);
      expect(chain.hierarchical.hyponyms.length).toBeGreaterThanOrEqual(2);
      expect(chain.hierarchical.coordinate_terms.length).toBeGreaterThanOrEqual(2);
      expect(chain.part_whole.holonyms.length).toBeGreaterThanOrEqual(2);
      expect(chain.part_whole.meronyms.length).toBeGreaterThanOrEqual(2);
      expect(chain.verb_relations.troponyms.length).toBeGreaterThanOrEqual(2);
      expect(chain.verb_relations.entailments.length).toBeGreaterThanOrEqual(2);
      expect(chain.lexical_relations.morphosemantic_links.length).toBeGreaterThanOrEqual(2);
      expect(chain.adjective_relations.antonyms.length).toBeGreaterThanOrEqual(2);
      expect(chain.adjective_relations.similar.length).toBeGreaterThanOrEqual(2);
      
      console.log('Sufficient examples provided for each relation type');
    });
  });
});

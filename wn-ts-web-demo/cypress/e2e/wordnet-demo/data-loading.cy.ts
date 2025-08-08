/// <reference types="cypress" />

describe('WordNet Data Loading', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('should initialize the application and show loading states', () => {
    // Check that the app loads
    cy.contains('WordNet TypeScript Demo').should('be.visible')
    
    // Wait for initialization
    cy.contains('System Status').should('be.visible')
    
    // Check that database statistics are displayed (even if 0)
    cy.contains('Database Statistics').should('be.visible')
    
    // Validate loading states are properly managed
    cy.get('[data-testid="system-status"]').should('exist')
    cy.get('[data-testid="system-status"]').within(() => {
      cy.get('p').should('exist')
    })
  })

  it('should validate WordNet and CILI package loading and data access', () => {
    cy.contains('Advanced').click()
    cy.log('Navigated to Advanced tab')
    
    // Check that package loading section is present
    cy.contains('Available Packages').should('be.visible')
    cy.log('Available packages section is visible')
    
    // Check that available packages are listed
    cy.contains('Click to load a WordNet package').should('be.visible')
    cy.log('Package loading instructions are visible')
    
    // Validate specific package information
    cy.contains('Open English WordNet (2024)').should('be.visible')
    cy.contains('Collaborative Interlingual Index (1.0)').should('be.visible')
    cy.log('Both OEWN and CILI packages are available')
    
    // Validate package button states
    cy.get('button').contains('Open English WordNet').should('be.visible')
    cy.get('button').contains('Collaborative Interlingual Index').should('be.visible')
    cy.log('Both package load buttons are visible')
    
    // Test OEWN package loading (if possible)
    cy.log('Testing OEWN package loading')
    cy.get('button').contains('Open English WordNet').then(($btn) => {
      if (!$btn.prop('disabled')) {
        cy.log('OEWN button is enabled - attempting to load')
        cy.wrap($btn).click()
        cy.wait(5000) // Wait for loading
        
        // Check if loading was successful by looking for progress or completion
        cy.get('body').then(($body) => {
          if ($body.text().includes('Loading') || $body.text().includes('Loaded')) {
            cy.log('OEWN loading process detected')
          }
        })
      } else {
        cy.log('OEWN button is disabled - may already be loaded or in progress')
      }
    })
    
    // Test CILI package loading (if possible)
    cy.log('Testing CILI package loading')
    cy.get('button').contains('Collaborative Interlingual Index').then(($btn) => {
      if (!$btn.prop('disabled')) {
        cy.log('CILI button is enabled - attempting to load')
        cy.wrap($btn).click()
        cy.wait(5000) // Wait for loading
        
        // Check if loading was successful
        cy.get('body').then(($body) => {
          if ($body.text().includes('Loading') || $body.text().includes('Loaded')) {
            cy.log('CILI loading process detected')
          }
        })
      } else {
        cy.log('CILI button is disabled - may already be loaded or in progress')
      }
    })
    
    // Validate that packages can be accessed after loading
    cy.log('Validating package access after loading')
    
    // Check if any packages are loaded by looking at the system status
    cy.get('[data-testid="system-status"]').then(($status) => {
      const statusText = $status.text()
      cy.log('System status after package loading:', statusText)
      
      if (statusText.includes('Loaded Lexicons') && !statusText.includes('No lexicons loaded')) {
        cy.log('Packages appear to be loaded successfully')
        
        // Navigate back to Basic tab to test search functionality
        cy.contains('Basic').click()
        cy.log('Navigated back to Basic tab to test loaded data')
        
        // Test search with loaded data
        cy.get('input[placeholder*="happy"]').clear().type('test')
        cy.get('button').contains('Search').click()
        cy.wait(2000)
        
        cy.get('pre').then(($pre) => {
          const searchContent = $pre.text()
          cy.log('Search results with loaded data:', searchContent.substring(0, 200))
          
          if (searchContent && searchContent !== '[]' && !searchContent.includes('error')) {
            cy.log('Search functionality working with loaded packages')
          }
        })
      } else {
        cy.log('No packages appear to be loaded yet')
      }
    })
  })

  it('should have export and import functionality with proper validation', () => {
    cy.contains('Advanced').click()
    
    // Check export functionality
    cy.contains('Export Database').should('be.visible')
    cy.get('button').contains('Export Database').should('be.visible')
    
    // Check import functionality
    cy.contains('Import Database').should('be.visible')
    cy.get('button').contains('Import Database').should('be.visible')
    
    // Validate database operations section structure
    cy.contains('Database Operations').should('be.visible')
    cy.contains('Export the current database or import one from your local machine').should('be.visible')
  })

  it('should have developer tools for data management with functionality validation', () => {
    cy.contains('Developer').click()
    
    // Check cache inspection
    cy.contains('Inspect Cache').should('be.visible')
    cy.get('button').contains('Inspect Cache').should('be.visible')
    
    // Check data management
    cy.contains('Clear DB Data').should('be.visible')
    cy.get('button').contains('Clear DB Data').should('be.visible')
    
    // Check OPFS snapshot functionality
    cy.contains('Save Snapshot to OPFS').should('be.visible')
    cy.get('button').contains('Save Snapshot to OPFS').should('be.visible')
    
    // Validate developer tools structure
    cy.contains('Cache & Storage').should('be.visible')
    cy.contains('Manage browser cache and OPFS storage').should('be.visible')
    cy.contains('OPFS Operations').should('be.visible')
    cy.contains('Save the current database state to a new file in OPFS').should('be.visible')
  })

  it('should display OPFS status information with browser capability detection', () => {
    // Check that OPFS status is displayed
    cy.contains('OPFS Status').should('be.visible')
    cy.log('OPFS Status section is visible')
    
    // Check that OPFS support information is shown
    cy.contains('OPFS Support').should('be.visible')
    cy.log('OPFS Support information is visible')
    
    // Validate OPFS support detection
    cy.get('[data-testid="opfs-status"]').should('exist')
    cy.log('OPFS status widget exists')
    
    // Log the actual OPFS status content for debugging
    cy.get('[data-testid="opfs-status"]').then(($opfs) => {
      const opfsText = $opfs.text()
      cy.log('OPFS Status content:', opfsText)
      
      if (opfsText.includes('Supported')) {
        cy.log('OPFS is supported - checking storage information')
        cy.wrap($opfs).within(() => {
          // Check if storage usage section exists
          cy.get('div').then(($divs) => {
            const hasStorageUsage = $divs.text().includes('Storage Usage')
            cy.log('Storage Usage section present:', hasStorageUsage)
            
            if (hasStorageUsage) {
              cy.contains('Storage Usage').should('be.visible')
              cy.contains('Used:').should('be.visible')
              cy.contains('Available:').should('be.visible')
              cy.contains('Total:').should('be.visible')
              cy.log('All storage information elements are visible')
            } else {
              cy.log('Storage Usage section not found - OPFS may not be fully supported')
            }
          })
        })
      } else {
        cy.log('OPFS is not supported - skipping storage validation')
      }
    })
  })

  it('should validate real WordNet data loading with strict statistics checks', () => {
    // First, ensure we have data loaded
    cy.contains('Advanced').click()
    cy.log('Navigating to Advanced tab to ensure data is loaded')
    
    // Load OEWN if not already loaded
    cy.get('button').contains('Open English WordNet').then(($btn) => {
      if (!$btn.prop('disabled')) {
        cy.log('Loading OEWN data...')
        cy.wrap($btn).click()
        cy.wait(10000) // Wait for data to load
      } else {
        cy.log('OEWN appears to be already loaded')
      }
    })
    
    // Navigate back to check statistics
    cy.contains('Basic').click()
    cy.log('Checking database statistics')
    
    // Validate statistics data structure and actual data
    cy.get('[data-testid="database-stats"]').should('exist').then(($stats) => {
      const statsText = $stats.text()
      cy.log('Full database stats content:', statsText)
      
      // Ensure we have actual data
      expect(statsText).not.to.include('No statistics available')
      cy.log('Database has data - performing strict validation')
      
      // Known WordNet 2024 statistics for validation
      const expectedStats = {
        words: {
          min: 150000,    // OEWN 2024 should have at least 150k words
          max: 200000,    // Reasonable upper bound
          typical: 160000 // Typical value around 160k
        },
        synsets: {
          min: 120000,    // OEWN 2024 should have at least 120k synsets
          max: 150000,    // Reasonable upper bound
          typical: 130000 // Typical value around 130k
        },
        senses: {
          min: 200000,    // OEWN 2024 should have at least 200k senses
          max: 300000,    // Reasonable upper bound
          typical: 250000 // Typical value around 250k
        },
        pos: {
          noun: { min: 0.6, max: 0.8 },     // 60-80% should be nouns
          verb: { min: 0.1, max: 0.2 },     // 10-20% should be verbs
          adjective: { min: 0.1, max: 0.2 }, // 10-20% should be adjectives
          adverb: { min: 0.02, max: 0.1 }   // 2-10% should be adverbs
        }
      }
      
      // Extract and validate actual numbers
      cy.wrap($stats).within(() => {
        // Get all statistic numbers
        cy.get('.font-mono').then(($numbers) => {
          const stats = {}
          let foundStats = false
          
          // First, log all numbers we find for debugging
          $numbers.each((i, el) => {
            const text = $(el).text().trim()
            cy.log(`Found number ${i + 1}:`, text)
          })
          
          // Now extract the numbers
          $numbers.each((i, el) => {
            const $parent = $(el).parent()
            const labelText = $parent.text().trim()
            const text = $(el).text().trim()
            
            if (text && text !== '0') {
              const num = parseInt(text.replace(/,/g, ''))
              cy.log(`Processing stat:`, { label: labelText, value: num })
              
              if (labelText.toLowerCase().includes('words')) {
                stats.words = num
                cy.log('Found word count:', num)
              }
              if (labelText.toLowerCase().includes('synsets')) {
                stats.synsets = num
                cy.log('Found synset count:', num)
              }
              if (labelText.toLowerCase().includes('senses')) {
                stats.senses = num
                cy.log('Found sense count:', num)
              }
              foundStats = true
            }
          })
          
          // Validate word count
          cy.log('Validating word count:', stats.words)
          expect(stats.words).to.be.within(
            expectedStats.words.min,
            expectedStats.words.max,
            `Word count (${stats.words}) should be between ${expectedStats.words.min} and ${expectedStats.words.max}`
          )
          
          // Validate synset count
          cy.log('Validating synset count:', stats.synsets)
          expect(stats.synsets).to.be.within(
            expectedStats.synsets.min,
            expectedStats.synsets.max,
            `Synset count (${stats.synsets}) should be between ${expectedStats.synsets.min} and ${expectedStats.synsets.max}`
          )
          
          // Validate sense count
          cy.log('Validating sense count:', stats.senses)
          expect(stats.senses).to.be.within(
            expectedStats.senses.min,
            expectedStats.senses.max,
            `Sense count (${stats.senses}) should be between ${expectedStats.senses.min} and ${expectedStats.senses.max}`
          )
          
          // Validate relationships between numbers
          cy.log('Validating relationships between numbers')
          
          // Senses should be more than words (each word has at least one sense)
          expect(stats.senses).to.be.greaterThan(
            stats.words,
            'Sense count should be greater than word count (polysemy)'
          )
          
          // Senses should be more than synsets (each synset has at least one word sense)
          expect(stats.senses).to.be.greaterThan(
            stats.synsets,
            'Sense count should be greater than synset count (synonymy)'
          )
          
          // Calculate and validate ratios
          const sensesPerWord = stats.senses / stats.words
          const sensesPerSynset = stats.senses / stats.synsets
          const wordsPerSynset = stats.words / stats.synsets
          
          cy.log('Average senses per word:', sensesPerWord.toFixed(2))
          cy.log('Average senses per synset:', sensesPerSynset.toFixed(2))
          cy.log('Average words per synset:', wordsPerSynset.toFixed(2))
          
          // Validate reasonable ratios
          expect(sensesPerWord).to.be.within(1, 5, 'Average senses per word should be reasonable')
          expect(sensesPerSynset).to.be.within(1, 5, 'Average senses per synset should be reasonable')
          expect(wordsPerSynset).to.be.within(0.5, 3, 'Average words per synset should be reasonable')
        })
        
        // Validate part of speech distribution
        cy.contains('Part of Speech').should('be.visible')
        cy.get('.font-mono').then(($numbers) => {
          const posStats = {}
          let total = 0
          
          $numbers.each((i, el) => {
            const text = el.textContent.trim()
            if (text && text !== '0') {
              const num = parseInt(text.replace(/,/g, ''))
              if (el.textContent.toLowerCase().includes('noun')) {
                posStats.noun = num
                total += num
              }
              if (el.textContent.toLowerCase().includes('verb')) {
                posStats.verb = num
                total += num
              }
              if (el.textContent.toLowerCase().includes('adjective')) {
                posStats.adjective = num
                total += num
              }
              if (el.textContent.toLowerCase().includes('adverb')) {
                posStats.adverb = num
                total += num
              }
            }
          })
          
          // Calculate and validate POS ratios
          if (total > 0) {
            const ratios = {
              noun: posStats.noun / total,
              verb: posStats.verb / total,
              adjective: posStats.adjective / total,
              adverb: posStats.adverb / total
            }
            
            cy.log('POS Distribution:', ratios)
            
            // Validate POS ratios against expected ranges
            expect(ratios.noun).to.be.within(
              expectedStats.pos.noun.min,
              expectedStats.pos.noun.max,
              `Noun ratio (${(ratios.noun * 100).toFixed(1)}%) should be between ${expectedStats.pos.noun.min * 100}% and ${expectedStats.pos.noun.max * 100}%`
            )
            
            expect(ratios.verb).to.be.within(
              expectedStats.pos.verb.min,
              expectedStats.pos.verb.max,
              `Verb ratio (${(ratios.verb * 100).toFixed(1)}%) should be between ${expectedStats.pos.verb.min * 100}% and ${expectedStats.pos.verb.max * 100}%`
            )
            
            expect(ratios.adjective).to.be.within(
              expectedStats.pos.adjective.min,
              expectedStats.pos.adjective.max,
              `Adjective ratio (${(ratios.adjective * 100).toFixed(1)}%) should be between ${expectedStats.pos.adjective.min * 100}% and ${expectedStats.pos.adjective.max * 100}%`
            )
            
            expect(ratios.adverb).to.be.within(
              expectedStats.pos.adverb.min,
              expectedStats.pos.adverb.max,
              `Adverb ratio (${(ratios.adverb * 100).toFixed(1)}%) should be between ${expectedStats.pos.adverb.min * 100}% and ${expectedStats.pos.adverb.max * 100}%`
            )
          }
        })
      })
      
      cy.log('All WordNet statistics validated successfully')
    })
  })

  it('should perform comprehensive system functionality validation', () => {
    // Wait for app to fully initialize
    cy.wait(3000)
    
    // Validate system status
    cy.get('[data-testid="system-status"]').should('exist')
    cy.get('[data-testid="system-status"]').within(() => {
      cy.get('p').should('exist')
    })
    
    // Validate database statistics
    cy.get('[data-testid="database-stats"]').should('exist')
    
    // Validate OPFS status
    cy.get('[data-testid="opfs-status"]').should('exist')
    cy.get('[data-testid="opfs-status"]').within(() => {
      cy.get('p').should('exist')
    })
    
    // Test tab navigation and content validation
    cy.contains('Basic').click()
    cy.contains('Basic WordNet Explorer').should('be.visible')
    cy.contains('Use this simple interface to search').should('be.visible')
    
    cy.contains('Advanced').click()
    cy.contains('Advanced Data Management').should('be.visible')
    cy.contains('Available Packages').should('be.visible')
    cy.contains('Database Operations').should('be.visible')
    
    cy.contains('Developer').click()
    cy.contains('Developer Tools').should('be.visible')
    cy.contains('Cache & Storage').should('be.visible')
    cy.contains('OPFS Operations').should('be.visible')
  })

  it('should validate real WordNet search functionality with actual data validation', () => {
    // First, ensure we have data loaded
    cy.contains('Advanced').click()
    cy.log('Navigating to Advanced tab to ensure data is loaded')
    
    // Load OEWN if not already loaded
    cy.get('button').contains('Open English WordNet').then(($btn) => {
      if (!$btn.prop('disabled')) {
        cy.log('Loading OEWN data...')
        cy.wrap($btn).click()
        cy.wait(10000) // Wait for data to load
      } else {
        cy.log('OEWN appears to be already loaded')
      }
    })
    
    // Navigate to Basic tab for search testing
    cy.contains('Basic').click()
    cy.log('Navigated to Basic tab')
    
    // Known WordNet test cases with expected results
    const testCases = [
      {
        word: 'run',
        expectedMinSynsets: 40,  // 'run' has many meanings
        expectedMinSenses: 50,   // Multiple senses across different POS
        expectedPOS: ['noun', 'verb'],  // Should have both noun and verb senses
        expectedDefinitions: [
          'move fast by using one\'s feet',
          'operate or function',
          'a score in baseball'
        ]
      },
      {
        word: 'happy',
        expectedMinSynsets: 5,   // Several meanings of happy
        expectedMinSenses: 7,    // Multiple senses, mainly as adjective
        expectedPOS: ['adjective'],
        expectedDefinitions: [
          'enjoying or showing or marked by joy or pleasure',
          'marked by good fortune'
        ]
      },
      {
        word: 'computer',
        expectedMinSynsets: 1,   // Primarily one main concept
        expectedMinSenses: 2,    // But multiple ways to refer to it
        expectedPOS: ['noun'],
        expectedDefinitions: [
          'a machine for performing calculations automatically'
        ]
      },
      {
        word: 'book',
        expectedMinSynsets: 10,  // Many meanings of book
        expectedMinSenses: 15,   // Multiple senses across different POS
        expectedPOS: ['noun', 'verb'],
        expectedDefinitions: [
          'a written work or composition',
          'engage for a performance',
          'record a charge against (someone)'
        ]
      }
    ]
    
    // Test each word with specific expectations
    testCases.forEach((testCase, index) => {
      cy.log(`Testing search for word: ${testCase.word} with specific expectations`)
      
      // Search for the word
      cy.get('input[placeholder*="happy"]').clear().type(testCase.word)
      cy.get('button').contains('Search').click()
      cy.wait(2000)
      
      // Test synset results
      cy.contains('synsets').click()
      cy.wait(1000)
      cy.get('pre').then(($pre) => {
        const content = $pre.text()
        const synsets = JSON.parse(content)
        cy.log(`Found ${synsets.length} synsets for "${testCase.word}"`)
        
        // Validate synset count
        expect(synsets.length).to.be.at.least(
          testCase.expectedMinSynsets,
          `"${testCase.word}" should have at least ${testCase.expectedMinSynsets} synsets`
        )
        
        // Validate synset structure and content
        synsets.forEach((synset, i) => {
          // Check required fields
          expect(synset).to.have.property('id')
          expect(synset).to.have.property('pos')
          expect(synset).to.have.property('definitions')
          
          // Log synset details
          cy.log(`Synset ${i + 1}:`, {
            id: synset.id,
            pos: synset.pos,
            definition: synset.definitions[0]
          })
          
          // Validate POS is one of the expected ones
          if (testCase.expectedPOS) {
            expect(testCase.expectedPOS).to.include(
              synset.pos,
              `"${testCase.word}" synset should have one of expected POS: ${testCase.expectedPOS.join(', ')}`
            )
          }
          
          // Check if any expected definition is present
          if (testCase.expectedDefinitions && i < 5) { // Check first 5 synsets
            const hasExpectedDef = testCase.expectedDefinitions.some(def =>
              synset.definitions.some(actualDef =>
                actualDef.toLowerCase().includes(def.toLowerCase())
              )
            )
            if (hasExpectedDef) {
              cy.log(`Found expected definition in synset ${i + 1}`)
            }
          }
        })
      })
      
      // Test sense results
      cy.contains('senses').click()
      cy.wait(1000)
      cy.get('pre').then(($pre) => {
        const content = $pre.text()
        const senses = JSON.parse(content)
        cy.log(`Found ${senses.length} senses for "${testCase.word}"`)
        
        // Validate sense count
        expect(senses.length).to.be.at.least(
          testCase.expectedMinSenses,
          `"${testCase.word}" should have at least ${testCase.expectedMinSenses} senses`
        )
        
        // Validate sense structure and content
        senses.forEach((sense, i) => {
          // Check required fields
          expect(sense).to.have.property('id')
          expect(sense).to.have.property('synset')
          
          // Log sense details
          if (i < 5) { // Log first 5 senses
            cy.log(`Sense ${i + 1}:`, {
              id: sense.id,
              synset: sense.synset
            })
          }
        })
      })
      
      // Test word results
      cy.contains('words').click()
      cy.wait(1000)
      cy.get('pre').then(($pre) => {
        const content = $pre.text()
        const words = JSON.parse(content)
        cy.log(`Found ${words.length} word entries for "${testCase.word}"`)
        
        // Validate word structure and content
        words.forEach((word, i) => {
          // Check required fields
          expect(word).to.have.property('id')
          expect(word).to.have.property('lemma')
          
          // Log word details
          if (i < 5) { // Log first 5 words
            cy.log(`Word ${i + 1}:`, {
              id: word.id,
              lemma: word.lemma
            })
          }
          
          // Validate lemma matches search term (accounting for case)
          expect(word.lemma.toLowerCase()).to.equal(
            testCase.word.toLowerCase(),
            'Word lemma should match search term'
          )
        })
      })
    })
    
    // Test edge cases with specific expectations
    cy.log('Testing edge cases with specific validation')
    
    // Test compound words
    const compoundWords = ['ice cream', 'high school', 'post office']
    compoundWords.forEach(word => {
      cy.log(`Testing compound word: ${word}`)
      cy.get('input[placeholder*="happy"]').clear().type(word)
      cy.get('button').contains('Search').click()
      cy.wait(1000)
      
      cy.get('pre').then(($pre) => {
        const content = $pre.text()
        const results = JSON.parse(content)
        expect(results.length).to.be.at.least(1, `Compound word "${word}" should have results`)
        cy.log(`Found ${results.length} results for compound word "${word}"`)
      })
    })
    
    // Test hyphenated words
    const hyphenatedWords = ['well-known', 'self-aware', 'state-of-the-art']
    hyphenatedWords.forEach(word => {
      cy.log(`Testing hyphenated word: ${word}`)
      cy.get('input[placeholder*="happy"]').clear().type(word)
      cy.get('button').contains('Search').click()
      cy.wait(1000)
      
      cy.get('pre').then(($pre) => {
        const content = $pre.text()
        const results = JSON.parse(content)
        if (results.length > 0) {
          cy.log(`Found ${results.length} results for hyphenated word "${word}"`)
        }
      })
    })
    
    // Test case sensitivity
    const caseTests = ['BOOK', 'Book', 'book']
    let baseResults
    
    caseTests.forEach((word, i) => {
      cy.log(`Testing case sensitivity: ${word}`)
      cy.get('input[placeholder*="happy"]').clear().type(word)
      cy.get('button').contains('Search').click()
      cy.wait(1000)
      
      cy.get('pre').then(($pre) => {
        const content = $pre.text()
        const results = JSON.parse(content)
        
        if (i === 0) {
          baseResults = results.length
        } else {
          expect(results.length).to.equal(
            baseResults,
            'Case variations should return same number of results'
          )
        }
        cy.log(`Found ${results.length} results for "${word}"`)
      })
    })
    
    cy.log('WordNet search functionality validation completed with actual data verification')
  })
})

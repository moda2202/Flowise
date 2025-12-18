import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import { FactCheckTool } from '../core'
import { ClaimSpotterResult } from '../core'

// Mock the throttledFetch method to avoid actual API calls
jest.mock('../core', () => {
    // just re-export everything
    return Object.assign({}, jest.requireActual('../core'))
})

describe('FactCheckTool Tests', () => {
    // ===== CATEGORIZATION TESTS =====
    describe('Categorization Logic', () => {
        let factCheckTool: FactCheckTool

        beforeEach(() => {
            factCheckTool = new FactCheckTool({
                apiKey: 'test-api-key',
                lowThreshold: 0.3,
                highThreshold: 0.7
            })
        })

        test('should categorize medical claims correctly', () => {
            // Access the private method using type assertion and any
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)

            const medicalClaims = [
                'Vaccines cause autism in children.',
                'Taking vitamin C prevents the common cold.',
                'The new treatment has cured 90% of patients in the trial.',
                'Doctors recommend drinking 8 glasses of water daily.',
                'The pandemic has infected over 1 million people worldwide.'
            ]

            medicalClaims.forEach((claim) => {
                expect(categoriseClaim(claim)).toBe('Medical/Health')
            })
        })

        test('should categorize climate claims correctly', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)

            const climateClaims = [
                'Global warming has increased average temperatures by 2°C.',
                'Climate change is causing more frequent hurricanes.',
                'The weather patterns have shifted dramatically in the past decade.',
                'Arctic ice is melting at an unprecedented rate.',
                'Temperature records were broken last summer.'
            ]

            climateClaims.forEach((claim) => {
                expect(categoriseClaim(claim)).toBe('Climate/Weather')
            })
        })

        test('should categorize historical claims correctly', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)

            const historicalClaims = [
                'The Berlin Wall fell in 1989.',
                'The 60s were a time of social revolution.',
                'In the 18th century, the industrial revolution began.',
                'The 2000s saw the rise of social media.',
                'The last decade has seen unprecedented technological growth.'
            ]

            historicalClaims.forEach((claim) => {
                expect(categoriseClaim(claim)).toBe('Historical')
            })
        })

        test('should categorize economic claims correctly', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)

            const economicClaims = [
                'The stock market has grown by $2 trillion this year.',
                'Housing prices have increased by 15% since last year.',
                'The cost of living has doubled in the past decade.',
                'The economy has created 200,000 new jobs.',
                'The dollar has strengthened against foreign currencies.'
            ]

            economicClaims.forEach((claim) => {
                expect(categoriseClaim(claim)).toBe('Economic')
            })
        })

        test('should categorize scientific claims correctly', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)

            const scientificClaims = [
                'A new study shows that coffee may reduce the risk of heart disease.',
                'Scientists have discovered a new species of frog in the Amazon.',
                'Research indicates that exercise improves cognitive function.',
                'Evidence suggests that dark matter makes up 85% of the universe.',
                'The scientific consensus is that vaccines are safe and effective.'
            ]

            scientificClaims.forEach((claim) => {
                expect(categoriseClaim(claim)).toBe('Scientific')
            })
        })

        test('should categorize political claims correctly', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)

            const politicalClaims = [
                'The government has increased spending on healthcare by 10%.',
                'New regulations will reduce carbon emissions by 30%.',
                'The policy change will affect 2 million citizens.',
                'The law was passed with bipartisan support.',
                'Government officials have denied the allegations.'
            ]

            politicalClaims.forEach((claim) => {
                expect(categoriseClaim(claim)).toBe('Political')
            })
        })

        test('should categorize ambiguous claims as General', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)

            const generalClaims = [
                'The sky is blue.',
                'Water boils at 100 degrees Celsius.',
                'The Earth orbits the Sun.',
                'Humans need oxygen to survive.',
                'Cats are mammals.'
            ]

            generalClaims.forEach((claim) => {
                expect(categoriseClaim(claim)).toBe('General')
            })
        })

        test('should handle empty strings', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)
            expect(categoriseClaim('')).toBe('General')
        })

        test('should handle case insensitivity', () => {
            const categoriseClaim = (factCheckTool as any).categoriseClaim.bind(factCheckTool)
            expect(categoriseClaim('VACCINES ARE SAFE')).toBe('Medical/Health')
            expect(categoriseClaim('vaccines are safe')).toBe('Medical/Health')
            expect(categoriseClaim('Vaccines Are Safe')).toBe('Medical/Health')
        })
    })

    // ===== CHECK-WORTHINESS TESTS =====
    describe('Check-Worthiness Assessment', () => {
        let factCheckTool: FactCheckTool

        beforeEach(() => {
            factCheckTool = new FactCheckTool({
                apiKey: 'test-api-key',
                lowThreshold: 0.3,
                highThreshold: 0.7
            })
        })

        test('should classify high priority claims correctly', () => {
            const getCheckWorthiness = (factCheckTool as any).getCheckWorthiness.bind(factCheckTool)

            const highScores = [0.7, 0.8, 0.9, 1.0]

            highScores.forEach((score) => {
                expect(getCheckWorthiness(score)).toBe('High Priority Check-Worthy Claim')
            })
        })

        test('should classify medium priority claims correctly', () => {
            const getCheckWorthiness = (factCheckTool as any).getCheckWorthiness.bind(factCheckTool)

            const mediumScores = [0.3, 0.4, 0.5, 0.6, 0.69]

            mediumScores.forEach((score) => {
                expect(getCheckWorthiness(score)).toBe('Medium Priority Check-Worthy Claim')
            })
        })

        test('should classify low priority claims correctly', () => {
            const getCheckWorthiness = (factCheckTool as any).getCheckWorthiness.bind(factCheckTool)

            const lowScores = [0, 0.1, 0.2, 0.29]

            lowScores.forEach((score) => {
                expect(getCheckWorthiness(score)).toBe('Non-Check-Worthy Statement')
            })
        })

        test('should handle boundary values correctly', () => {
            const getCheckWorthiness = (factCheckTool as any).getCheckWorthiness.bind(factCheckTool)

            // Exact threshold values should be classified in the higher category
            expect(getCheckWorthiness(0.3)).toBe('Medium Priority Check-Worthy Claim')
            expect(getCheckWorthiness(0.7)).toBe('High Priority Check-Worthy Claim')
        })

        test('should handle custom thresholds correctly', () => {
            // Create a tool with custom thresholds
            const customTool = new FactCheckTool({
                apiKey: 'test-api-key',
                lowThreshold: 0.4,
                highThreshold: 0.8
            })

            const getCheckWorthiness = (customTool as any).getCheckWorthiness.bind(customTool)

            // Test with the custom thresholds
            expect(getCheckWorthiness(0.3)).toBe('Non-Check-Worthy Statement')
            expect(getCheckWorthiness(0.4)).toBe('Medium Priority Check-Worthy Claim')
            expect(getCheckWorthiness(0.7)).toBe('Medium Priority Check-Worthy Claim')
            expect(getCheckWorthiness(0.8)).toBe('High Priority Check-Worthy Claim')
        })

        test('should handle edge cases', () => {
            const getCheckWorthiness = (factCheckTool as any).getCheckWorthiness.bind(factCheckTool)

            // Handle extreme values
            expect(getCheckWorthiness(0)).toBe('Non-Check-Worthy Statement')
            expect(getCheckWorthiness(1)).toBe('High Priority Check-Worthy Claim')

            // Handle invalid values (though in practice these should be constrained by the API)
            expect(getCheckWorthiness(-0.1)).toBe('Non-Check-Worthy Statement')
            expect(getCheckWorthiness(1.1)).toBe('High Priority Check-Worthy Claim')
        })
    })

    // ===== SUGGESTION GENERATION TESTS =====
    describe('Suggestion Generation Logic', () => {
        let factCheckTool: FactCheckTool

        beforeEach(() => {
            factCheckTool = new FactCheckTool({
                apiKey: 'test-api-key',
                lowThreshold: 0.3,
                highThreshold: 0.7
            })
        })

        test('should generate appropriate suggestions for high priority medical claims', () => {
            const generateSuggestedActions = (factCheckTool as any).generateSuggestedActions.bind(factCheckTool)

            const actions = generateSuggestedActions(0.8, 'Medical/Health')

            // Check for general high priority suggestions
            expect(actions).toContain('High priority for fact-checking')
            expect(actions).toContain('Verify with multiple authoritative sources')
            expect(actions).toContain('Check for recent fact-checks on this topic')

            // Check for medical-specific suggestions
            expect(actions).toContain('Verify with medical journals')
            expect(actions).toContain('Check WHO guidelines')

            // Check that medium/low priority suggestions are not included
            expect(actions).not.toContain('Consider fact-checking if resources allow')
            expect(actions).not.toContain('No immediate fact-checking needed')
        })

        test('should generate appropriate suggestions for medium priority climate claims', () => {
            const generateSuggestedActions = (factCheckTool as any).generateSuggestedActions.bind(factCheckTool)

            const actions = generateSuggestedActions(0.5, 'Climate/Weather')

            // Check for general medium priority suggestions
            expect(actions).toContain('Consider fact-checking if resources allow')
            expect(actions).toContain('Monitor for related claims')

            // Check for climate-specific suggestions
            expect(actions).toContain('Consult IPCC reports')

            // Check that high/low priority suggestions are not included
            expect(actions).not.toContain('High priority for fact-checking')
            expect(actions).not.toContain('No immediate fact-checking needed')
        })

        test('should generate appropriate suggestions for low priority scientific claims', () => {
            const generateSuggestedActions = (factCheckTool as any).generateSuggestedActions.bind(factCheckTool)

            const actions = generateSuggestedActions(0.2, 'Scientific')

            // Check for general low priority suggestions
            expect(actions).toContain('No immediate fact-checking needed')
            expect(actions).toContain('Statement is not a factual claim')

            // Check for scientific-specific suggestions
            expect(actions).toContain('Check peer-reviewed literature')

            // Check that high/medium priority suggestions are not included
            expect(actions).not.toContain('High priority for fact-checking')
            expect(actions).not.toContain('Consider fact-checking if resources allow')
        })

        test('should generate appropriate suggestions for high priority general claims', () => {
            const generateSuggestedActions = (factCheckTool as any).generateSuggestedActions.bind(factCheckTool)

            const actions = generateSuggestedActions(0.9, 'General')

            // Check for general high priority suggestions only
            expect(actions).toContain('High priority for fact-checking')
            expect(actions).toContain('Verify with multiple authoritative sources')
            expect(actions).toContain('Check for recent fact-checks on this topic')

            // Check that no domain-specific suggestions are included
            expect(actions).not.toContain('Verify with medical journals')
            expect(actions).not.toContain('Consult IPCC reports')
            expect(actions).not.toContain('Check peer-reviewed literature')
        })

        test('should handle boundary values correctly', () => {
            const generateSuggestedActions = (factCheckTool as any).generateSuggestedActions.bind(factCheckTool)

            // At low threshold boundary
            const lowBoundary = generateSuggestedActions(0.3, 'General')
            expect(lowBoundary).toContain('Consider fact-checking if resources allow')

            // At high threshold boundary
            const highBoundary = generateSuggestedActions(0.7, 'General')
            expect(highBoundary).toContain('High priority for fact-checking')
        })

        test('should handle custom thresholds correctly', () => {
            // Create a tool with custom thresholds
            const customTool = new FactCheckTool({
                apiKey: 'test-api-key',
                lowThreshold: 0.4,
                highThreshold: 0.8
            })

            const generateSuggestedActions = (customTool as any).generateSuggestedActions.bind(customTool)

            // Test with the custom thresholds
            const lowActions = generateSuggestedActions(0.3, 'General')
            expect(lowActions).toContain('No immediate fact-checking needed')

            const mediumActions = generateSuggestedActions(0.5, 'General')
            expect(mediumActions).toContain('Consider fact-checking if resources allow')

            const highActions = generateSuggestedActions(0.9, 'General')
            expect(highActions).toContain('High priority for fact-checking')
        })
    })

    // ===== SOURCE RECOMMENDATION TESTS =====
    describe('Source Recommendation Logic', () => {
        let factCheckTool: FactCheckTool

        beforeEach(() => {
            factCheckTool = new FactCheckTool({
                apiKey: 'test-api-key'
            })
        })

        test('should recommend appropriate sources for Medical/Health claims', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('Medical/Health')

            expect(sources).toContain('PubMed Central')
            expect(sources).toContain('WHO Database')
            expect(sources).toContain('CDC Reports')
            expect(sources).toContain('Medical Journals')
            expect(sources.length).toBe(4)
        })

        test('should recommend appropriate sources for Climate/Weather claims', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('Climate/Weather')

            expect(sources).toContain('NOAA')
            expect(sources).toContain('NASA Climate')
            expect(sources).toContain('IPCC Reports')
            expect(sources.length).toBe(3)
        })

        test('should recommend appropriate sources for Scientific claims', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('Scientific')

            expect(sources).toContain('Google Scholar')
            expect(sources).toContain('Science Direct')
            expect(sources).toContain('Nature')
            expect(sources.length).toBe(3)
        })

        test('should recommend appropriate sources for Economic claims', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('Economic')

            expect(sources).toContain('World Bank Data')
            expect(sources).toContain('IMF Statistics')
            expect(sources).toContain('Federal Reserve')
            expect(sources.length).toBe(3)
        })

        test('should recommend appropriate sources for Political claims', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('Political')

            expect(sources).toContain('Government Websites')
            expect(sources).toContain('Official Records')
            expect(sources.length).toBe(2)
        })

        test('should recommend appropriate sources for Historical claims', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('Historical')

            expect(sources).toContain('Academic Databases')
            expect(sources).toContain('National Archives')
            expect(sources.length).toBe(2)
        })

        test('should recommend default sources for General claims', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('General')

            expect(sources).toContain('Fact-checking websites')
            expect(sources).toContain('Academic sources')
            expect(sources).toContain('Official records')
            expect(sources.length).toBe(3)
        })

        test('should recommend default sources for unknown categories', () => {
            const suggestSources = (factCheckTool as any).suggestSources.bind(factCheckTool)

            const sources = suggestSources('Unknown Category')

            expect(sources).toContain('Fact-checking websites')
            expect(sources).toContain('Academic sources')
            expect(sources).toContain('Official records')
            expect(sources.length).toBe(3)
        })
    })

    // ===== CLAIM ANALYSIS TESTS =====
    describe('Claim Analysis Logic', () => {
        let factCheckTool: FactCheckTool

        beforeEach(() => {
            factCheckTool = new FactCheckTool({
                apiKey: 'test-api-key',
                lowThreshold: 0.3,
                highThreshold: 0.7
            })
        })

        test('should analyze claims correctly', async () => {
            // Mock the private methods that analyseClaim depends on
            ;(factCheckTool as any).categoriseClaim = jest.fn().mockReturnValue('Medical/Health')
            ;(factCheckTool as any).getCheckWorthiness = jest.fn().mockReturnValue('High Priority Check-Worthy Claim')
            ;(factCheckTool as any).generateSuggestedActions = jest.fn().mockReturnValue(['Action 1', 'Action 2'])
            ;(factCheckTool as any).suggestSources = jest.fn().mockReturnValue(['Source 1', 'Source 2'])

            // Access the private method using type assertion
            const analyseClaim = (factCheckTool as any).analyseClaim.bind(factCheckTool)

            // Test input
            const spottedClaim = {
                text: 'Vaccines cause autism in children.',
                score: 0.85
            }

            // Call the method
            const result = await analyseClaim(spottedClaim)

            // Verify the result structure
            expect(result).toEqual({
                claim: 'Vaccines cause autism in children.',
                spotterScore: 0.85,
                checkWorthiness: 'High Priority Check-Worthy Claim',
                category: 'Medical/Health',
                confidence: 0.85,
                matchedFactChecks: [],
                evidence: [],
                suggestedActions: ['Action 1', 'Action 2'],
                potentialSources: ['Source 1', 'Source 2'],
                verdict: {
                    status: 'unverified',
                    explanation: 'Claim requires verification from authoritative sources.'
                }
            })

            // Verify that the dependent methods were called with correct arguments
            expect((factCheckTool as any).categoriseClaim).toHaveBeenCalledWith('Vaccines cause autism in children.')
            expect((factCheckTool as any).getCheckWorthiness).toHaveBeenCalledWith(0.85)
            expect((factCheckTool as any).generateSuggestedActions).toHaveBeenCalledWith(0.85, 'Medical/Health')
            expect((factCheckTool as any).suggestSources).toHaveBeenCalledWith('Medical/Health')
        })

        test('should generate fact check result correctly', () => {
            // Access the private method using type assertion
            const generateFactCheckResult = (factCheckTool as any).generateFactCheckResult.bind(factCheckTool)

            // Mock generateVerificationPriorities
            ;(factCheckTool as any).generateVerificationPriorities = jest.fn().mockReturnValue(['Priority 1', 'Priority 2'])

            // Test input
            const analyses = [
                {
                    claim: 'Claim 1',
                    spotterScore: 0.85,
                    checkWorthiness: 'High Priority Check-Worthy Claim',
                    category: 'Medical/Health',
                    confidence: 0.85,
                    matchedFactChecks: [],
                    evidence: [],
                    suggestedActions: ['Action 1'],
                    potentialSources: ['Source 1'],
                    verdict: {
                        status: 'unverified',
                        explanation: 'Explanation 1'
                    }
                },
                {
                    claim: 'Claim 2',
                    spotterScore: 0.5,
                    checkWorthiness: 'Medium Priority Check-Worthy Claim',
                    category: 'Climate/Weather',
                    confidence: 0.5,
                    matchedFactChecks: [],
                    evidence: [],
                    suggestedActions: ['Action 2'],
                    potentialSources: ['Source 2'],
                    verdict: {
                        status: 'unverified',
                        explanation: 'Explanation 2'
                    }
                },
                {
                    claim: 'Claim 3',
                    spotterScore: 0.2,
                    checkWorthiness: 'Non-Check-Worthy Statement',
                    category: 'General',
                    confidence: 0.2,
                    matchedFactChecks: [],
                    evidence: [],
                    suggestedActions: ['Action 3'],
                    potentialSources: ['Source 3'],
                    verdict: {
                        status: 'unverified',
                        explanation: 'Explanation 3'
                    }
                }
            ]

            const startTime = Date.now() - 1000 // 1 second ago

            // Call the method
            const result = generateFactCheckResult(analyses, startTime)

            // Verify the result structure
            expect(result.summary.totalClaims).toBe(3)
            expect(result.summary.checkWorthinessBreakdown.highPriority).toBe(1)
            expect(result.summary.checkWorthinessBreakdown.mediumPriority).toBe(1)
            expect(result.summary.checkWorthinessBreakdown.lowPriority).toBe(1)
            expect(result.summary.averageConfidence).toBeCloseTo(0.52, 2)
            expect(result.summary.topCategories).toContain('Medical/Health')
            expect(result.summary.topCategories).toContain('Climate/Weather')
            expect(result.summary.topCategories).toContain('General')
            expect(result.summary.verdictDistribution.unverified).toBe(3)

            expect(result.detailedAnalysis).toEqual(analyses)

            expect(result.batchMetrics.batchSize).toBe(5) // Default batch size
            expect(result.batchMetrics.successRate).toBe(1)
            expect(result.batchMetrics.processingTime).toBeGreaterThanOrEqual(1000)

            expect(result.verificationPriorities).toEqual(['Priority 1', 'Priority 2'])

            // Verify that generateVerificationPriorities was called with correct arguments
            expect((factCheckTool as any).generateVerificationPriorities).toHaveBeenCalledWith(analyses)
        })

        test('should generate verification priorities correctly', () => {
            // Access the private method using type assertion
            const generateVerificationPriorities = (factCheckTool as any).generateVerificationPriorities.bind(factCheckTool)

            // Test input
            const analyses = [
                {
                    claim: 'High priority claim 1',
                    spotterScore: 0.9,
                    checkWorthiness: 'High Priority Check-Worthy Claim',
                    category: 'Medical/Health',
                    verdict: { status: 'unverified' }
                },
                {
                    claim: 'Medium priority claim',
                    spotterScore: 0.5,
                    checkWorthiness: 'Medium Priority Check-Worthy Claim',
                    category: 'Climate/Weather',
                    verdict: { status: 'unverified' }
                },
                {
                    claim: 'High priority claim 2',
                    spotterScore: 0.8,
                    checkWorthiness: 'High Priority Check-Worthy Claim',
                    category: 'Political',
                    verdict: { status: 'unverified' }
                },
                {
                    claim: 'Low priority claim',
                    spotterScore: 0.2,
                    checkWorthiness: 'Non-Check-Worthy Statement',
                    category: 'General',
                    verdict: { status: 'unverified' }
                }
            ]

            // Call the method
            const result = generateVerificationPriorities(analyses)

            // Verify the result
            expect(result.length).toBe(2) // Only high priority claims
            expect(result[0]).toContain('High priority claim 1')
            expect(result[0]).toContain('0.90')
            expect(result[1]).toContain('High priority claim 2')
            expect(result[1]).toContain('0.80')

            // Verify sorting (highest score first)
            expect(result[0]).toContain('Medical/Health')
            expect(result[1]).toContain('Political')
        })
    })

    // ===== INTEGRATION TESTS =====
    describe('Integration Tests', () => {
        // Test with mocked API responses
        describe('With mocked API responses', () => {
            let factCheckTool: FactCheckTool

            beforeEach(() => {
                factCheckTool = new FactCheckTool({
                    apiKey: 'test-api-key',
                    lowThreshold: 0.3,
                    highThreshold: 0.7
                })

                // Mock the callClaimBusterAPI method
                ;(factCheckTool as any).callClaimBusterAPI = jest.fn()
            })

            test('should process a high priority medical claim correctly', async () => {
                // Mock the API response
                ;(factCheckTool as any).callClaimBusterAPI.mockResolvedValue({
                    text: 'Vaccines cause autism in children.',
                    score: 0.85
                })

                // Call the main method
                const result = await factCheckTool._call({ input: 'Vaccines cause autism in children.' })

                // Parse the result
                const parsedResult = JSON.parse(result)

                // Verify the API was called with the correct input
                expect((factCheckTool as any).callClaimBusterAPI).toHaveBeenCalledWith('Vaccines cause autism in children.')

                // Verify the result structure and content
                expect(parsedResult.summary.totalClaims).toBe(1)
                expect(parsedResult.summary.checkWorthinessBreakdown.highPriority).toBe(1)
                expect(parsedResult.summary.checkWorthinessBreakdown.mediumPriority).toBe(0)
                expect(parsedResult.summary.checkWorthinessBreakdown.lowPriority).toBe(0)
                expect(parsedResult.summary.topCategories).toContain('Medical/Health')

                // Verify the detailed analysis
                expect(parsedResult.detailedAnalysis[0].claim).toBe('Vaccines cause autism in children.')
                expect(parsedResult.detailedAnalysis[0].spotterScore).toBe(0.85)
                expect(parsedResult.detailedAnalysis[0].checkWorthiness).toBe('High Priority Check-Worthy Claim')
                expect(parsedResult.detailedAnalysis[0].category).toBe('Medical/Health')

                // Verify the suggested actions
                expect(parsedResult.detailedAnalysis[0].suggestedActions).toContain('High priority for fact-checking')
                expect(parsedResult.detailedAnalysis[0].suggestedActions).toContain('Verify with medical journals')

                // Verify the potential sources
                expect(parsedResult.detailedAnalysis[0].potentialSources).toContain('WHO Database')
                expect(parsedResult.detailedAnalysis[0].potentialSources).toContain('CDC Reports')

                // Verify the verification priorities
                expect(parsedResult.verificationPriorities.length).toBe(1)
                expect(parsedResult.verificationPriorities[0]).toContain('Priority Check Required')
                expect(parsedResult.verificationPriorities[0]).toContain('Vaccines cause autism in children.')
            })

            test('should process a medium priority climate claim correctly', async () => {
                // Mock the API response
                ;(factCheckTool as any).callClaimBusterAPI.mockResolvedValue({
                    text: 'Global temperatures have risen by 1.5°C in the past century.',
                    score: 0.5
                })

                // Call the main method
                const result = await factCheckTool._call({ input: 'Global temperatures have risen by 1.5°C in the past century.' })

                // Parse the result
                const parsedResult = JSON.parse(result)

                // Verify the API was called with the correct input
                expect((factCheckTool as any).callClaimBusterAPI).toHaveBeenCalledWith(
                    'Global temperatures have risen by 1.5°C in the past century.'
                )

                // Verify the result structure and content
                expect(parsedResult.summary.totalClaims).toBe(1)
                expect(parsedResult.summary.checkWorthinessBreakdown.highPriority).toBe(0)
                expect(parsedResult.summary.checkWorthinessBreakdown.mediumPriority).toBe(1)
                expect(parsedResult.summary.checkWorthinessBreakdown.lowPriority).toBe(0)
                expect(parsedResult.summary.topCategories).toContain('Climate/Weather')

                // Verify the detailed analysis
                expect(parsedResult.detailedAnalysis[0].claim).toBe('Global temperatures have risen by 1.5°C in the past century.')
                expect(parsedResult.detailedAnalysis[0].spotterScore).toBe(0.5)
                expect(parsedResult.detailedAnalysis[0].checkWorthiness).toBe('Medium Priority Check-Worthy Claim')
                expect(parsedResult.detailedAnalysis[0].category).toBe('Climate/Weather')

                // Verify the suggested actions
                expect(parsedResult.detailedAnalysis[0].suggestedActions).toContain('Consider fact-checking if resources allow')
                expect(parsedResult.detailedAnalysis[0].suggestedActions).toContain('Consult IPCC reports')

                // Verify the potential sources
                expect(parsedResult.detailedAnalysis[0].potentialSources).toContain('NOAA')
                expect(parsedResult.detailedAnalysis[0].potentialSources).toContain('NASA Climate')

                // Verify the verification priorities
                expect(parsedResult.verificationPriorities.length).toBe(0) // Medium priority claims are not included
            })

            test('should process a low priority general claim correctly', async () => {
                // Mock the API response
                ;(factCheckTool as any).callClaimBusterAPI.mockResolvedValue({
                    text: 'The sky is blue.',
                    score: 0.2
                })

                // Call the main method
                const result = await factCheckTool._call({ input: 'The sky is blue.' })

                // Parse the result
                const parsedResult = JSON.parse(result)

                // Verify the API was called with the correct input
                expect((factCheckTool as any).callClaimBusterAPI).toHaveBeenCalledWith('The sky is blue.')

                // Verify the result structure and content
                expect(parsedResult.summary.totalClaims).toBe(1)
                expect(parsedResult.summary.checkWorthinessBreakdown.highPriority).toBe(0)
                expect(parsedResult.summary.checkWorthinessBreakdown.mediumPriority).toBe(0)
                expect(parsedResult.summary.checkWorthinessBreakdown.lowPriority).toBe(1)
                expect(parsedResult.summary.topCategories).toContain('General')

                // Verify the detailed analysis
                expect(parsedResult.detailedAnalysis[0].claim).toBe('The sky is blue.')
                expect(parsedResult.detailedAnalysis[0].spotterScore).toBe(0.2)
                expect(parsedResult.detailedAnalysis[0].checkWorthiness).toBe('Non-Check-Worthy Statement')
                expect(parsedResult.detailedAnalysis[0].category).toBe('General')

                // Verify the suggested actions
                expect(parsedResult.detailedAnalysis[0].suggestedActions).toContain('No immediate fact-checking needed')
                expect(parsedResult.detailedAnalysis[0].suggestedActions).toContain('Statement is not a factual claim')

                // Verify the potential sources
                expect(parsedResult.detailedAnalysis[0].potentialSources).toContain('Fact-checking websites')
                expect(parsedResult.detailedAnalysis[0].potentialSources).toContain('Academic sources')

                // Verify the verification priorities
                expect(parsedResult.verificationPriorities.length).toBe(0) // Low priority claims are not included
            })

            test('should handle API errors gracefully', async () => {
                // Mock the API to throw an error
                ;(factCheckTool as any).callClaimBusterAPI.mockRejectedValue(new Error('API error: 429 Too Many Requests'))

                // Call the main method and expect it to throw
                await expect(factCheckTool._call({ input: 'Test claim' })).rejects.toThrow(
                    'FactCheckTool: API error: 429 Too Many Requests'
                )
            })

            test('should respect the detailedAnalysis configuration', async () => {
                // Create a tool with detailedAnalysis set to false
                const simpleFactCheckTool = new FactCheckTool({
                    apiKey: 'test-api-key',
                    detailedAnalysis: false
                })

                // Mock the API response
                ;(simpleFactCheckTool as any).callClaimBusterAPI = jest
                    .fn<() => Promise<ClaimSpotterResult>>() // ✅ only one generic allowed
                    .mockResolvedValue({
                        text: 'Test claim',
                        score: 0.8
                    })

                // Call the main method
                const result = await simpleFactCheckTool._call({ input: 'Test claim' })

                // Parse the result
                const parsedResult = JSON.parse(result)

                // Verify that detailedAnalysis is empty
                expect(parsedResult.detailedAnalysis).toEqual([])
            })
        })

        // Tests with real API calls (conditionally executed)
        describe('With real API calls', () => {
            // Skip these tests by default to avoid actual API calls during automated testing
            // To run these tests, remove the .skip or use a conditional flag

            let factCheckTool: FactCheckTool
            const API_KEY = process.env.CLAIMBUSTER_API_KEY || 'your-api-key-here'

            // Only run these tests if an API key is provided
            const shouldRunLiveTests = API_KEY !== 'your-api-key-here'

            beforeEach(() => {
                if (!shouldRunLiveTests) {
                    console.log('Skipping live API tests. Set CLAIMBUSTER_API_KEY environment variable to run them.')
                    return
                }

                factCheckTool = new FactCheckTool({
                    apiKey: API_KEY,
                    maxRequestsPerMinute: 10 // Lower rate limit for testing
                })
            })

            // Use conditional test execution
            const conditionalTest = shouldRunLiveTests ? test : test.skip

            conditionalTest('should successfully call the real ClaimBuster API', async () => {
                // Only run if we have an API key
                if (!shouldRunLiveTests) return

                const result = await factCheckTool._call({ input: 'The Earth is flat.' })
                const parsedResult = JSON.parse(result)

                // Basic validation of the response structure
                expect(parsedResult.summary).toBeDefined()
                expect(parsedResult.detailedAnalysis).toBeDefined()
                expect(parsedResult.detailedAnalysis[0].claim).toBe('The Earth is flat.')
                expect(typeof parsedResult.detailedAnalysis[0].spotterScore).toBe('number')
            })

            conditionalTest('should handle rate limiting with multiple requests', async () => {
                // Only run if we have an API key
                if (!shouldRunLiveTests) return

                // Make multiple requests in quick succession
                const claims = ['The Earth is flat.', 'Vaccines cause autism.', 'Climate change is a hoax.']

                const startTime = Date.now()

                // Process all claims
                const results = await Promise.all(claims.map((claim) => factCheckTool._call({ input: claim })))

                const endTime = Date.now()
                const duration = endTime - startTime

                // With a rate limit of 10 per minute, 3 requests should take at least 12 seconds
                // This is a rough check for rate limiting behavior
                expect(duration).toBeGreaterThanOrEqual(12000)

                // Verify all results are valid JSON
                results.forEach((result) => {
                    const parsedResult = JSON.parse(result)
                    expect(parsedResult.summary).toBeDefined()
                    expect(parsedResult.detailedAnalysis).toBeDefined()
                })
            })

            conditionalTest('should handle API errors with retry logic', async () => {
                // Only run if we have an API key
                if (!shouldRunLiveTests) return

                // Create a tool with a modified throttledFetch that will fail on first attempt
                const testTool = new FactCheckTool({
                    apiKey: API_KEY
                })

                // Store the original method
                const originalThrottledFetch = (testTool as any).throttledFetch

                // Replace with a version that fails on first attempt
                let attemptCount = 0
                ;(testTool as any).throttledFetch = async (url: string, options: RequestInit, retries = 3, backoffMs = 500) => {
                    attemptCount++
                    if (attemptCount === 1) {
                        throw new Error('Simulated network error')
                    }
                    return originalThrottledFetch.call(testTool, url, options, retries, backoffMs)
                }

                // The call should succeed despite the first attempt failing
                const result = await testTool._call({ input: 'Test claim with retry' })
                const parsedResult = JSON.parse(result)

                // Verify the result and that multiple attempts were made
                expect(parsedResult.summary).toBeDefined()
                expect(attemptCount).toBeGreaterThan(1)
            })
        })
    })
})

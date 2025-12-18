import { z } from 'zod'
import { StructuredTool, ToolParams } from '@langchain/core/tools'

/* ----------  type declarations  ---------- */

export interface ClaimSpotterResult {
    text: string
    score: number // 0‒1 score from ClaimBuster
}

export interface ClaimMatchResult {
    matchedClaim?: string
    existingVerdict?: string
    confidence: number
    source?: string
}

export interface EvidenceResult {
    source: string
    snippet: string
    type: 'supporting' | 'contradicting' | 'related'
    confidence: number
}

export interface ClaimAnalysis {
    claim: string
    spotterScore: number
    checkWorthiness: string
    category: string
    confidence: number
    matchedFactChecks: ClaimMatchResult[]
    evidence: EvidenceResult[]
    suggestedActions: string[]
    potentialSources: string[]
    verdict?: {
        status: 'true' | 'false' | 'partially_true' | 'unverified'
        explanation: string
        correctInformation?: string
    }
}

export interface FactCheckResult {
    summary: {
        totalClaims: number
        checkWorthinessBreakdown: {
            highPriority: number
            mediumPriority: number
            lowPriority: number
        }
        averageConfidence: number
        topCategories: string[]
        verdictDistribution: {
            true: number
            false: number
            partially_true: number
            unverified: number
        }
    }
    detailedAnalysis: ClaimAnalysis[]
    batchMetrics: {
        processingTime: number
        batchSize: number
        successRate: number
    }
    verificationPriorities: string[]
}

export interface FactCheckParams extends ToolParams {
    apiKey: string
    maxRequestsPerMinute?: number
    lowThreshold?: number
    highThreshold?: number
    batchSize?: number
    includeSources?: boolean
    requireCitations?: boolean
    detailedAnalysis?: boolean
    /** kept only to satisfy existing caller */
    input?: string
}

/* ----------  main tool class  ---------- */

export class FactCheckTool extends StructuredTool {
    name = 'factCheck'
    description = 'Advanced fact-checking tool that scores claims with ClaimBuster, categorises them and suggests verification steps.'

    // The LLM / Flowise must pass `{ input: "<sentence>" }`
    schema = z.object({
        input: z.string().describe('The text to analyse for fact-checking')
    })

    /* ----- config props ----- */
    private apiKey: string
    private lowThreshold: number
    private highThreshold: number
    private batchSize: number
    private includeSources: boolean
    private requireCitations: boolean
    private detailedAnalysis: boolean
    private maxRequestsPerMinute: number

    /* ----- runtime throttle state ----- */
    private lastRequestTs = 0

    constructor({
        apiKey,
        maxRequestsPerMinute = 60,
        lowThreshold = 0.3,
        highThreshold = 0.7,
        batchSize = 5,
        includeSources = true,
        requireCitations = false,
        detailedAnalysis = true,
        ...rest
    }: FactCheckParams) {
        super(rest)
        this.apiKey = apiKey
        this.lowThreshold = lowThreshold
        this.highThreshold = highThreshold
        this.batchSize = batchSize
        this.includeSources = includeSources
        this.requireCitations = requireCitations
        this.detailedAnalysis = detailedAnalysis
        this.maxRequestsPerMinute = maxRequestsPerMinute
    }

    /* ----------  primary entrypoint ---------- */

    /** @ignore */
    async _call({ input }: z.infer<typeof this.schema>): Promise<string> {
        try {
            const startTime = Date.now()

            // 1️⃣  score the claim
            const apiResult = await this.callClaimBusterAPI(input)

            // 2️⃣  analyse & classify
            const analysis = await this.analyseClaim(apiResult)

            // 3️⃣  wrap into final JSON
            const result = this.generateFactCheckResult([analysis], startTime)
            return JSON.stringify(result, null, 2)
        } catch (error) {
            throw error instanceof Error ? new Error(`FactCheckTool: ${error.message}`) : new Error('FactCheckTool: unknown error')
        }
    }

    /* ----------  helpers  ---------- */

    /** rate-limited fetch with exponential back-off on network / 5xx errors */
    private async throttledFetch(url: string, options: RequestInit, retries = 3, backoffMs = 500): Promise<Response> {
        /* 1. throttle */
        const interval = Math.ceil(60_000 / this.maxRequestsPerMinute)
        const wait = this.lastRequestTs + interval - Date.now()
        if (wait > 0) await new Promise((res) => setTimeout(res, wait))

        /* 2. attempt request */
        try {
            const res = await fetch(url, options)

            if (!res.ok && res.status >= 500 && retries > 0) {
                await new Promise((res) => setTimeout(res, backoffMs))
                return this.throttledFetch(url, options, retries - 1, backoffMs * 2)
            }

            this.lastRequestTs = Date.now()
            return res
        } catch (err) {
            if (retries === 0) throw err
            await new Promise((res) => setTimeout(res, backoffMs))
            return this.throttledFetch(url, options, retries - 1, backoffMs * 2)
        }
    }

    private async callClaimBusterAPI(claim: string): Promise<ClaimSpotterResult> {
        const url = `https://idir.uta.edu/claimbuster/api/v2/score/text/sentences/${encodeURIComponent(claim)}`

        const response = await this.throttledFetch(url, {
            method: 'GET',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`ClaimBuster API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const { text, score } = data.results[0]
        return { text, score }
    }

    /* ----- analysis helpers (unchanged) ----- */

    private analyseClaim = async (spottedClaim: ClaimSpotterResult): Promise<ClaimAnalysis> => {
        const category = this.categoriseClaim(spottedClaim.text)
        const checkWorthiness = this.getCheckWorthiness(spottedClaim.score)
        const suggestedActions = this.generateSuggestedActions(spottedClaim.score, category)
        const potentialSources = this.suggestSources(category)

        return {
            claim: spottedClaim.text,
            spotterScore: spottedClaim.score,
            checkWorthiness,
            category,
            confidence: spottedClaim.score,
            matchedFactChecks: [],
            evidence: [],
            suggestedActions,
            potentialSources,
            verdict: {
                status: 'unverified',
                explanation: 'Claim requires verification from authoritative sources.'
            }
        }
    }

    private getCheckWorthiness(score: number): string {
        if (score >= this.highThreshold) return 'High Priority Check-Worthy Claim'
        if (score >= this.lowThreshold) return 'Medium Priority Check-Worthy Claim'
        return 'Non-Check-Worthy Statement'
    }

    /** Classify a claim into one of the predefined buckets */
    /** Classify the claim text into a category expected by the test-suite */
    /** Return one of the fixed category strings for the supplied claim. */
    private categoriseClaim(claim: string): string {
        const txt = claim.toLowerCase()

        /* 1 ─ Scientific --------------------------------------------------------- */
        if (
            /\b(?:scientific|stud(?:y|ies)|research|scientists?|evidence|peer-?review(?:ed)?|journal|experiment|data-?driven|empirical|hypothesis)\b/.test(
                txt
            )
        ) {
            return 'Scientific'
        }

        /* 2 ─ Medical / Health --------------------------------------------------- */
        if (
            /\b(?:health|medical|diseases?|illnesses?|treatments?|cures?|medicine|doctors?|physicians?|patients?|vaccines?|vaccination|autism|infections?|viruses?|pandemic|diagnos(?:e|is)|symptoms?|clinics?|hospitals?|vitamins?)\b/.test(
                txt
            )
        ) {
            return 'Medical/Health'
        }

        /* 3 ─ Political ---------------------------------------------------------- */
        if (
            /\b(?:government|officials?|politic|policies|policy|law|regulations?|election|bill|senate|congress|minister|president|legislation|vote|campaign)\b/.test(
                txt
            )
        ) {
            return 'Political'
        }

        /* 4 ─ Economic ----------------------------------------------------------- */
        if (
            /\b(?:gdp|econom(?:y|ic)|inflation|market|stock|housing|unemployment|jobs?|recession|dollar|cost|price|tax|budget)\b|\$/.test(
                txt
            )
        ) {
            return 'Economic'
        }

        /* 5 ─ Climate / Weather -------------------------------------------------- */
        if (
            /\b(?:global\s+warming|climate\s+change|greenhouse|emission(?:s)?|co2|carbon\s+dioxide|sea\s+level|hurricane|drought|rainfall|precipitation|heatwave|ice\s+melt|temperature(?:s)?|arctic|weather|melting)\b/.test(
                txt
            )
        ) {
            return 'Climate/Weather'
        }

        /* 6 ─ Historical --------------------------------------------------------- */
        if (
            /\b(?:century|decade|historical|history|war|era|battle|ancient|medieval|ago)\b/.test(txt) ||
            /\b(1[5-9]\d{2}|20[01]\d|19\d{2})\b/.test(txt) || // years 1500-2019
            /\b\d{4}s\b/.test(txt) || // e.g. 2000s
            /\b\d{2}s\b/.test(txt) // e.g. 60s
        ) {
            return 'Historical'
        }

        return 'General'
    }

    private generateSuggestedActions(score: number, category: string): string[] {
        const actions: string[] = []

        if (score >= this.highThreshold) {
            actions.push('High priority for fact-checking')
            actions.push('Verify with multiple authoritative sources')
            actions.push('Check for recent fact-checks on this topic')
        } else if (score >= this.lowThreshold) {
            actions.push('Consider fact-checking if resources allow')
            actions.push('Monitor for related claims')
        } else {
            actions.push('No immediate fact-checking needed')
            actions.push('Statement is not a factual claim')
        }

        switch (category) {
            case 'Medical/Health':
                actions.push('Verify with medical journals')
                actions.push('Check WHO guidelines')
                break
            case 'Climate/Weather':
                actions.push('Consult IPCC reports')
                break
            case 'Scientific':
                actions.push('Check peer-reviewed literature')
                break
        }
        return actions
    }

    private suggestSources(category: string): string[] {
        const map: Record<string, string[]> = {
            'Medical/Health': ['PubMed Central', 'WHO Database', 'CDC Reports', 'Medical Journals'],
            'Climate/Weather': ['NOAA', 'NASA Climate', 'IPCC Reports'],
            Scientific: ['Google Scholar', 'Science Direct', 'Nature'],
            Economic: ['World Bank Data', 'IMF Statistics', 'Federal Reserve'],
            Political: ['Government Websites', 'Official Records'],
            Historical: ['Academic Databases', 'National Archives']
        }

        return map[category] ?? ['Fact-checking websites', 'Academic sources', 'Official records']
    }

    private generateFactCheckResult(analyses: ClaimAnalysis[], startTime: number): FactCheckResult {
        const high = analyses.filter((a) => a.checkWorthiness === 'High Priority Check-Worthy Claim').length
        const medium = analyses.filter((a) => a.checkWorthiness === 'Medium Priority Check-Worthy Claim').length
        const low = analyses.filter((a) => a.checkWorthiness === 'Non-Check-Worthy Statement').length

        const verdictDistribution = {
            true: analyses.filter((a) => a.verdict?.status === 'true').length,
            false: analyses.filter((a) => a.verdict?.status === 'false').length,
            partially_true: analyses.filter((a) => a.verdict?.status === 'partially_true').length,
            unverified: analyses.filter((a) => a.verdict?.status === 'unverified').length
        }

        const categoryCount = analyses.reduce<Record<string, number>>((acc, cur) => {
            acc[cur.category] = (acc[cur.category] ?? 0) + 1
            return acc
        }, {})

        const topCategories = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cat]) => cat)

        return {
            summary: {
                totalClaims: analyses.length,
                checkWorthinessBreakdown: {
                    highPriority: high,
                    mediumPriority: medium,
                    lowPriority: low
                },
                averageConfidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / Math.max(1, analyses.length),
                topCategories,
                verdictDistribution
            },
            detailedAnalysis: this.detailedAnalysis ? analyses : [],
            batchMetrics: {
                processingTime: Date.now() - startTime,
                batchSize: this.batchSize,
                successRate: 1
            },
            verificationPriorities: this.generateVerificationPriorities(analyses)
        }
    }

    private generateVerificationPriorities(analyses: ClaimAnalysis[]): string[] {
        return analyses
            .filter((a) => a.checkWorthiness === 'High Priority Check-Worthy Claim')
            .sort((a, b) => b.spotterScore - a.spotterScore)
            .map(
                (a) =>
                    `Priority Check Required: ${a.claim} (${a.category}, Score: ${a.spotterScore.toFixed(2)}${
                        a.verdict ? ` [${a.verdict.status.toUpperCase()}]` : ''
                    })`
            )
    }
}

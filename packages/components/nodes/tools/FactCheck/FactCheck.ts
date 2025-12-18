import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { FactCheckTool } from './core'

/* -------------------------------------------------------------------------- */
/*  Flowise wrapper for the FactCheckTool                                     */
/* -------------------------------------------------------------------------- */

class FactCheck_Tools implements INode {
    label = 'Fact Check'
    name = 'factCheck'
    version = 2
    description = 'Advanced fact-checking tool with comprehensive analysis and verification suggestions'
    type = 'FactCheck'
    icon = 'check.svg'
    category = 'Tools'
    baseClasses = [...getBaseClasses(FactCheckTool)]

    /* ---------- credential selector ---------- */
    credential: INodeParams = {
        label: 'Connect Credential',
        name: 'credential',
        type: 'credential',
        credentialNames: ['claimBusterApi']
    }

    /* ---------- user inputs ---------- */
    inputs: INodeParams[] = [
        {
            label: 'Text to analyse',
            name: 'input',
            type: 'string',
            rows: 4,
            placeholder: 'Paste one claim or sentence here'
        },
        {
            label: 'Low Risk Threshold',
            name: 'lowThreshold',
            type: 'number',
            step: 0.1,
            default: 0.3,
            optional: true
        },
        {
            label: 'High Risk Threshold',
            name: 'highThreshold',
            type: 'number',
            step: 0.1,
            default: 0.7,
            optional: true
        },
        {
            label: 'Batch Size',
            name: 'batchSize',
            type: 'number',
            default: 5,
            optional: true
        },
        {
            label: 'Max Requests / Minute',
            name: 'maxRequestsPerMinute',
            type: 'number',
            default: 60,
            optional: true
        },
        {
            label: 'Include Sources',
            name: 'includeSources',
            type: 'boolean',
            default: true,
            optional: true
        },
        {
            label: 'Require Citations',
            name: 'requireCitations',
            type: 'boolean',
            default: false,
            optional: true
        },
        {
            label: 'Detailed Analysis',
            name: 'detailedAnalysis',
            type: 'boolean',
            default: true,
            optional: true
        }
    ]

    /* ---------------------------------------------------------------------- */
    /*  Initialise: resolve creds, parse UI, build StructuredTool              */
    /* ---------------------------------------------------------------------- */
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        /* 1. credentials */
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const claimBusterApiKey = getCredentialParam('claimBusterApiKey', credentialData, nodeData)

        /* 2. numeric inputs with safe defaults */
        const lowThreshold = Number(nodeData.inputs?.lowThreshold ?? 0.3)
        const highThreshold = Number(nodeData.inputs?.highThreshold ?? 0.7)
        const batchSize = Number(nodeData.inputs?.batchSize ?? 5)
        const maxRPM = Number(nodeData.inputs?.maxRequestsPerMinute ?? 60)

        /* 3. boolean inputs with explicit defaults */
        const includeSources = nodeData.inputs?.includeSources ?? true
        const requireCitations = nodeData.inputs?.requireCitations ?? false
        const detailedAnalysis = nodeData.inputs?.detailedAnalysis ?? true

        /* 4. text input (type checker happy) */
        const textInput = (nodeData.inputs?.input as string) ?? ''

        /* 5. build the underlying tool */
        return new FactCheckTool({
            apiKey: claimBusterApiKey,
            input: textInput, // still required by the interface
            lowThreshold,
            highThreshold,
            batchSize,
            maxRequestsPerMinute: maxRPM,
            includeSources,
            requireCitations,
            detailedAnalysis
        })
    }
}

module.exports = { nodeClass: FactCheck_Tools }

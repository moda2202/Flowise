import { INodeParams, INodeCredential } from '../src/Interface'

class ClaimBusterApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'ClaimBuster API'
        this.name = 'claimBusterApi'
        this.version = 1.0
        this.description = 'Refer to https://idir.uta.edu/claimbuster/api/ to get API key'
        this.inputs = [
            {
                label: 'API Key',
                name: 'claimBusterApiKey',
                type: 'password',
                placeholder: '<AIRTABLE_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: ClaimBusterApi }

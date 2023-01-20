
export interface ItemJson {
    data: ItemData
    included?: RepositoryItemData[]
    errors?: {detail: string}[]
}

export interface ItemData {
    id: string
    type: string
    attributes: RepositoryAttrs|DocumentaryUnitAttrs|HistoricalAgentAttrs
    meta?: MetaAttrs
}

export interface RepositoryItemData {
    id: string
    type: string
    attributes: RepositoryAttrs
    meta?: MetaAttrs
}

export interface MetaAttrs {
    subitems?: number
    updated?: string
}

export interface Address {
    streetAddress?: string
    city?: string
    region?: string
    postalCode?: string
    country?: string
    countryCode?: string
    email: string[]
    telephone: string[]
    fax: string[]
    url: string[]
}

export interface RepositoryAttrs {
    name: string
    parallelFormsOfName?: string[]
    otherFormsOfName?: string[]
    address: Address
    history?: string
}

export interface DocumentaryUnitAttrs {
    localId: string
    alternateIds: string[]
    descriptions: DocumentaryUnitDescriptionAttrs[]
}

export interface DocumentaryUnitDescriptionAttrs {
    name: string
    language: string
    parallelFormsOfName: string[]
    biographicalHistory?: string
    extentAndMedium?: string
    scopeAndContent?: string
}

export interface HistoricalAgentAttrs {
    name: string
    parallelFormsOfName?: string[]
    otherFormsOfName?: string[]
    history?: string
}

export interface ItemJson {
    data: ItemData
}

export interface ItemData {
    id: string
    type: string
    attributes: object
    meta?: object
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

type Lat = number
type Lon = number

export interface Geo {
    type: string
    coordinates: [Lat, Lon]
}

export interface RepositoryAttrs {
    name: string
    parallelFormsOfName: string[]
    otherFormsOfName: string[]
    address: Address
    history?: string
    holdings?: string
    openingTimes?: string
    reproductionServices?: string
    geo: Geo
}



export interface ItemJson {
    data: ItemData
}

export interface ItemData {
    id: string
    type: string
    attributes: object
    meta?: object
}


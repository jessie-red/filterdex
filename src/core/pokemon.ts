export const types = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'] as const;
export type Type = (typeof types)[number];

export type Ability = {
    0: string;
    1?: string;
    H?: string;
};

export const tiers = ['AG', 'Uber', '(Uber)', 'OU', '(OU)', 'UUBL', 'UU', 'RUBL', 'RU',
    'NUBL', 'NU', '(NU)', 'PUBL', 'PU', '(PU)', 'ZUBL', 'ZU', 'NFE', 'LC',
    'Unreleased', 'Illegal', 'CAP', 'CAP NFE', 'CAP LC'] as const;
export type Tier = (typeof tiers)[number];

export const stages = ['Basic', 'Stage 1', 'Stage 2', 'Mega', 'Primal', 'Gmax'] as const;
export type Stage = (typeof stages)[number];

export const regions = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Hisui', 'Paldea'] as const;
export type Region = (typeof regions)[number];

export const eggGroups = ['Monster', 'Water 1', 'Water 2', 'Water 3', 'Bug', 'Flying', 'Field', 'Fairy',
    'Grass', 'Human-Like', 'Mineral', 'Amorphous', 'Ditto', 'Dragon', 'Undiscovered'] as const;
export type EggGroup = (typeof eggGroups)[number];

export const tags = ['Mythical', 'Sub-Legendary', 'Paradox', 'Ultra Beast', 'Restricted Legendary'] as const;
export type Tag = (typeof tags)[number];

export const colors = ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Brown', 'Purple', 'Gray', 'White', 'Pink'] as const;
export type Color = (typeof colors)[number];

export interface Pokemon {
    num: number;
    id: string;
    name: string;
    spriteid: string;
    types: [Type, Type?];
    moves: string[];
    abilities: Ability;
    baseStats: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
    };
    forme?: string;
    gen: number;
    latestGeneration: number;
    region: Region;
    eggGroups: EggGroup[];
    weightkg: number;
    heightm: number;
    tags: Tag[];
    stage: Stage;
    color: Color;
    restricted?: boolean;
    tier: Tier;
    vgc: boolean;
    champions: boolean;
}

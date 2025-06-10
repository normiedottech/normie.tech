import { BlockchainName, ChainId } from "../wallet/types"

export class Remittance {
    static NAME = "REMIT"
    static PROJECT_ID = "zelle"
    static BLOCKCHAIN : BlockchainName = "base"
    static CHAIN_ID : ChainId = 8453
    static TOKEN : `0x${string}` = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}

export class ZelleManualRemittance extends Remittance {
    static NAME = "ZELLE MANUAL"
    static PROJECT_ID = "zelle-manual"

    
}
export class ZelleMailRemittance extends Remittance {
    static NAME = "ZELLE MAIL"
    static PROJECT_ID = "zelle-mail"
    static BLOCKCHAIN : BlockchainName = "polygon"
    static CHAIN_ID : ChainId = 137
    static TOKEN : `0x${string}` = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
}
export class ZellePhoenixRemittance extends Remittance {
    static NAME = "ZELLE PHOENIX"
    static PROJECT_ID = "zelle-pheonix"
    static BLOCKCHAIN : BlockchainName = "polygon"
    static CHAIN_ID : ChainId = 137
    static TOKEN : `0x${string}` = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
}
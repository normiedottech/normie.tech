import { BlockchainName, ChainId } from "@/wallet/types"

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

export class ZellePhoenixRemittance extends Remittance {
    static NAME = "ZELLE PHOENIX"
    static PROJECT_ID = "zelle-pheonix"
    static BLOCKCHAIN : BlockchainName = "polygon"
    static CHAIN_ID : ChainId = 137
    static TOKEN : `0x${string}` = "0x0000000000000000000000000000000000000000"
}
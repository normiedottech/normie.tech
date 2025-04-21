export class Remittance {
    static NAME = "REMIT"
    static PROJECT_ID = "zelle"
}

export class ZelleManualRemittance extends Remittance {
    static NAME = "ZELLE MANUAL"
    static PROJECT_ID = "zelle-manual"
    
}

export class ZellePhoenixRemittance extends Remittance {
    static NAME = "ZELLE PHOENIX"
    static PROJECT_ID = "zelle-pheonix"
}
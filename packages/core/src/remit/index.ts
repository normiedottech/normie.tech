export class Remittance {
    static NAME = "REMIT"
    static PROJECT_ID = "zelle"
}

export class ZelleManualRemittance extends Remittance {
    static NAME = "ZELLE MANUAL"
    static PROJECT_ID = "zelle-manual"
    
}

export class ZellePh {
    static ZELLE_MANUAL = new ZelleManualRemittance()
    
}
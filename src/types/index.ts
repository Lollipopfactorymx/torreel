// Tipos para documentos del inquilino
export interface TenantDocument {
    type: DocumentType;
    url: string;
    publicId: string;
    uploadedAt: string;
    verified: boolean;
    verificationStatus: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    verifiedBy?: string;
    verifiedAt?: string;
}

export type DocumentType =
    | 'tenant_id'           // Identificación del inquilino
    | 'tenant_address'      // Comprobante de domicilio del inquilino
    | 'guarantor_id'        // Identificación del aval
    | 'guarantor_address';  // Comprobante de domicilio del aval

export interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}

export interface TenantDocumentation {
    tenantId: string;
    contractId: string;
    documents: TenantDocument[];
    emergencyContacts: EmergencyContact[];
    completedAt?: string;
    status: 'pending' | 'partial' | 'complete';
    createdAt: string;
    updatedAt: string;
}

// Tipos para pagos
export interface Payment {
    id?: string;
    tenantId: string;
    contractId: string;
    amount: number;
    concept: string;
    paymentDate: string;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue' | 'pending_review';
    receiptUrl?: string;
    receiptPublicId?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Configuración del checklist de documentos
export const DOCUMENT_CHECKLIST = [
    {
        type: 'tenant_id' as DocumentType,
        label: 'Identificación del Inquilino (INE)',
        description: 'Copia de la credencial para votar vigente',
        required: true
    },
    {
        type: 'tenant_address' as DocumentType,
        label: 'Comprobante de Domicilio del Inquilino',
        description: 'Recibo de luz, agua o teléfono (no mayor a 3 meses)',
        required: true
    },
    {
        type: 'guarantor_id' as DocumentType,
        label: 'Identificación del Aval (INE)',
        description: 'Copia de la credencial para votar vigente del fiador',
        required: true
    },
    {
        type: 'guarantor_address' as DocumentType,
        label: 'Comprobante de Domicilio del Aval',
        description: 'Recibo de luz, agua o teléfono del fiador (no mayor a 3 meses)',
        required: true
    }
];

// Tipo para el usuario
export interface User {
    uid: string;
    fullname: string;
    email: string;
    phone?: string;
    telegramChatId?: string;
    amount?: number;
    datepayment?: string;
    payments?: Payment[];
    roles: {
        ADMIN?: string;
        INQUILINO?: string;
    };
}

// Tipo para el contrato
export interface Contract {
    id: string;
    tenantId: string;
    profile: {
        fullname: string;
        email: string;
        phone?: string;
        telegramChatId?: string;
    };
    data: {
        department: string;
        startDate: string;
        duration: string;
        monthlyRent: string;
        deposit: string;
        tenantId: string;
        guarantorName: string;
        guarantorAddress: string;
        guarantorPhone: string;
        guarantorId: string;
    };
    tenantSignature?: string;
    guarantorSignature?: string;
    signedAt?: string;
    status: 'draft' | 'pending' | 'signed' | 'active' | 'expired' | 'cancelled';
    pdfUrl?: string;
    documentation?: TenantDocumentation;
    createdAt: string;
    updatedAt: string;
}

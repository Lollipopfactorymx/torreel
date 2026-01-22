# Torreel - Sistema de Administracion de Propiedades

Sistema web para la administracion de propiedades en renta, gestion de inquilinos, contratos y pagos.

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Backend/Auth**: Firebase (Authentication, Firestore)
- **Almacenamiento de archivos**: Cloudinary
- **Generacion de PDF**: jsPDF + html2canvas
- **Firmas digitales**: react-signature-canvas
- **Hosting**: Firebase Hosting

## Requisitos

- Node.js 18+
- npm o yarn
- Cuenta de Firebase
- Cuenta de Cloudinary

## Instalacion

1. Clonar el repositorio:
```bash
git clone https://github.com/Lollipopfactorymx/torreel.git
cd dtorreel
```

2. Instalar dependencias:
```bash
npm install --legacy-peer-deps
```

3. Configurar variables de entorno en `src/constants/config.ts`:
```typescript
const config = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};
```

4. Configurar Cloudinary en `src/constants/cloudinary.ts`:
```typescript
export const CLOUDINARY_CONFIG = {
  cloudName: 'tu-cloud-name',
  uploadPreset: 'tu-preset'
};
```

5. Iniciar servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
src/
├── assets/
│   └── images/           # Imagenes e iconos
├── components/
│   ├── Account/          # Pagina de cuenta de usuario
│   ├── Admin/            # Panel de administracion y sidebar
│   ├── App/              # Componente principal con rutas
│   ├── Contract/         # Gestion de contratos
│   │   ├── index.tsx         # Lista de contratos (admin)
│   │   ├── ContractForm.tsx  # Formulario crear/editar contrato
│   │   ├── ContractViewer.tsx # Visualizador con firma y PDF
│   │   └── MyContract.tsx    # Vista de contrato del inquilino
│   ├── FileUpload/       # Componente de carga de archivos
│   ├── Firebase/         # Configuracion y contexto de Firebase
│   ├── FooterTE/         # Footer
│   ├── HeaderTE/         # Header
│   ├── Home/             # Pagina de inicio
│   ├── Map/              # Componente de mapa
│   ├── Navigation/       # Navegacion principal
│   ├── PasswordChange/   # Cambio de contrasena
│   ├── PasswordForget/   # Recuperacion de contrasena
│   ├── Payment/          # Gestion de pagos
│   │   ├── index.tsx         # Lista de pagos (admin)
│   │   ├── details.tsx       # Detalles de pago
│   │   └── MyPayments.tsx    # Pagos del inquilino
│   ├── Session/          # Manejo de sesion y autorizacion
│   ├── SignIn/           # Inicio de sesion
│   ├── SignOut/          # Cierre de sesion
│   ├── SignUp/           # Registro de usuarios
│   └── Tenant/           # Gestion de inquilinos
│       ├── index.tsx         # Lista de inquilinos
│       ├── add.tsx           # Agregar inquilino
│       └── edit.tsx          # Editar inquilino
├── constants/
│   ├── cloudinary.ts     # Configuracion de Cloudinary
│   ├── config.ts         # Configuracion de Firebase
│   ├── roles.ts          # Definicion de roles
│   └── routes.ts         # Rutas de la aplicacion
├── services/
│   └── cloudinaryService.ts  # Servicio de subida de archivos
├── types/
│   └── index.ts          # Tipos TypeScript
└── index.tsx             # Punto de entrada
```

## Rutas

### Publicas
| Ruta | Componente | Descripcion |
|------|------------|-------------|
| `/` | Home | Pagina de inicio |
| `/signin` | SignIn | Inicio de sesion |
| `/signup` | SignUp | Registro |
| `/pw-forget` | PasswordForget | Recuperar contrasena |

### Protegidas (requieren autenticacion)
| Ruta | Componente | Rol | Descripcion |
|------|------------|-----|-------------|
| `/dashboard` | Admin | Todos | Panel principal |
| `/account` | Account | Todos | Cuenta de usuario |
| `/tenant` | Tenant | Admin | Lista de inquilinos |
| `/tenant/add` | TenantAdd | Admin | Agregar inquilino |
| `/tenant/edit/:uid` | TenantEdit | Admin | Editar inquilino |
| `/payment` | Payment | Admin | Lista de pagos |
| `/payment/details/:uid` | PaymentDetails | Admin | Detalles de pago |
| `/contracts` | Contracts | Admin | Lista de contratos |
| `/contracts/new` | ContractForm | Admin | Nuevo contrato |
| `/contracts/view/:id` | ContractViewer | Todos | Ver contrato |
| `/my-contract` | MyContract | Inquilino | Mi contrato |
| `/my-payments` | MyPayments | Inquilino | Mis pagos |

## Roles de Usuario

### ADMIN
- Ver y gestionar todos los inquilinos
- Crear, editar y eliminar contratos
- Ver todos los pagos
- Acceso a estadisticas

### INQUILINO
- Ver su propio contrato
- Firmar contratos digitalmente
- Ver historial de pagos
- Actualizar su cuenta

## Funcionalidades Principales

### Gestion de Contratos
- Creacion de contratos con datos del arrendador e inquilino
- Edicion de contratos existentes
- Firma digital del inquilino usando canvas
- Firma del arrendador (imagen predefinida)
- Generacion de PDF del contrato firmado
- Envio de contrato por correo electronico

### Gestion de Inquilinos
- Alta de nuevos inquilinos
- Edicion de informacion
- Asignacion de contratos

### Gestion de Pagos
- Registro de pagos
- Historial de pagos por inquilino
- Vista de pagos para inquilinos

### Subida de Archivos
- Integracion con Cloudinary
- Carga de documentos e imagenes

## Modelos de Datos

### Usuario (Firestore: `users/{uid}`)
```typescript
{
  fullname: string;
  email: string;
  amount: number;
  datepayment: string;
  payments: Payment[];
  roles: {
    ADMIN?: string;
    INQUILINO?: string;
  };
}
```

### Contrato (Firestore: `contracts/{id}`)
```typescript
{
  lessorName: string;          // Nombre del arrendador
  lessorId: string;            // RFC/ID del arrendador
  lessorAddress: string;       // Direccion del arrendador
  tenantId: string;            // UID del inquilino
  tenantName: string;          // Nombre del inquilino
  tenantIdNumber: string;      // RFC/ID del inquilino
  propertyAddress: string;     // Direccion de la propiedad
  monthlyRent: number;         // Renta mensual
  startDate: string;           // Fecha de inicio
  endDate: string;             // Fecha de fin
  depositAmount: number;       // Deposito
  paymentDay: number;          // Dia de pago (1-31)
  additionalClauses: string;   // Clausulas adicionales
  tenantSignature: string;     // Firma del inquilino (base64)
  signedAt: Timestamp;         // Fecha de firma
  createdAt: Timestamp;        // Fecha de creacion
  updatedAt: Timestamp;        // Fecha de actualizacion
}
```

### Pago
```typescript
{
  amount: number;
  date: string;
  concept: string;
}
```

## Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios: solo el propio usuario o admin puede leer/escribir
    match /users/{userId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.ADMIN != null);
    }

    // Contratos: admin puede todo, inquilino solo leer el suyo
    match /contracts/{contractId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.ADMIN != null;
      allow update: if request.auth != null &&
        resource.data.tenantId == request.auth.uid;
    }
  }
}
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Compilar para produccion
npm run build

# Vista previa de produccion
npm run preview

# Linting
npm run lint
```

## Despliegue

### Firebase Hosting

1. Instalar Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Iniciar sesion:
```bash
firebase login
```

3. Compilar el proyecto:
```bash
npm run build
```

4. Desplegar:
```bash
firebase deploy --only hosting
```

## Configuracion de Cloudinary

1. Crear cuenta en [Cloudinary](https://cloudinary.com)
2. Crear un upload preset sin firma (unsigned)
3. Actualizar `src/constants/cloudinary.ts` con tus credenciales

## Configuracion de Telegram Bot

Bot configurado: **@torreel_pagos_bot**

Para configurar notificaciones automáticas de pago por Telegram:

1. Lee la guía completa en [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)
2. El bot ya está creado: `@torreel_pagos_bot`
3. Token ya configurado en `.env`
4. Despliega la función webhook en Firebase Functions
5. Los inquilinos pueden conectar su Telegram desde su perfil

**Características:**
- ✅ Captura automática de Chat ID
- 📅 Recordatorios de pago automáticos
- 📸 **Verificación de pagos con IA** (OpenAI Vision)
- ✅ Confirmaciones de pagos verificados
- 📢 Notificaciones importantes sobre contratos

**Guías:**
- [Configuración técnica](TELEGRAM_SETUP.md) - Para desarrolladores
- [Guía de uso para inquilinos](TELEGRAM_PAYMENT_GUIDE.md) - Cómo enviar comprobantes

## Notas Importantes

- La firma del arrendador se encuentra en `src/assets/images/landlord-signature.png`
- Para cambiar la firma, reemplazar el archivo con una imagen PNG con fondo transparente
- Los contratos solo muestran la firma del arrendador despues de que el inquilino firma
- La generacion de PDF usa html2canvas, por lo que estilos CSS complejos pueden variar

## Proximas Funcionalidades

- [ ] Envio de correos automaticos (notificaciones de pago)
- [ ] Reportes y estadisticas
- [ ] Recordatorios de vencimiento de contrato
- [ ] Integracion con pasarela de pagos

## Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Proyecto privado - Todos los derechos reservados.

import React, { useState, useRef, useContext } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { withFirebase } from '../Firebase';
import { withRouter } from 'react-router-dom';
import HeaderTE from '../HeaderTE';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext } from '../Session';
import * as ROUTES from '../../constants/routes';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import vectoresFondoImg from '../../assets/images/vectores-fondo.png';
import landlordSignatureImg from '../../assets/images/landlord-signature.png';

interface ContractViewerProps {
    firebase: any;
    history: any;
    match: any;
}

const ContractViewer: React.FC<ContractViewerProps> = ({ firebase, history, match }) => {
    const authUser = useContext(AuthUserContext) as any;
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);
    const guarantorSigCanvas = useRef<SignatureCanvas>(null);
    const contractRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const contractId = match.params.id;

        firebase.db.collection('contracts').doc(contractId).get()
            .then((doc: any) => {
                if (doc.exists) {
                    setContract({ id: doc.id, ...doc.data() });
                }
                setLoading(false);
            })
            .catch((error: any) => {
                console.error('Error loading contract:', error);
                setLoading(false);
            });
    }, [firebase, match.params.id]);

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const clearGuarantorSignature = () => {
        guarantorSigCanvas.current?.clear();
    };

    const handleSign = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            alert('Por favor, firma el contrato antes de continuar');
            return;
        }

        if (!guarantorSigCanvas.current || guarantorSigCanvas.current.isEmpty()) {
            alert('Por favor, el aval debe firmar el contrato');
            return;
        }

        setSigning(true);

        try {
            const tenantSignature = sigCanvas.current.toDataURL();
            const guarantorSignature = guarantorSigCanvas.current.toDataURL();

            await firebase.db.collection('contracts').doc(contract.id).update({
                tenantSignature,
                guarantorSignature,
                signedAt: new Date().toISOString(),
                status: 'signed'
            });

            alert('Contrato firmado exitosamente');
            history.push(ROUTES.ACCOUNT);
        } catch (error) {
            console.error('Error signing contract:', error);
            alert('Error al firmar el contrato');
        } finally {
            setSigning(false);
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount) || 0);
    };

    const getDay = (dateStr: string) => dateStr ? new Date(dateStr).getDate() : '___';
    const getMonth = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('es-MX', { month: 'long' }).toUpperCase() : '_______';
    const getYear = (dateStr: string) => dateStr ? new Date(dateStr).getFullYear() : '_______';

    const calculateEndDate = (startDate: string, duration: string) => {
        if (!startDate) return '';
        const date = new Date(startDate);
        const months = parseInt(duration) || 12;
        date.setMonth(date.getMonth() + months);
        return date.toISOString();
    };

    const generatePDF = async () => {
        if (!contractRef.current) return;

        setGeneratingPdf(true);

        try {
            const element = contractRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter'
            });

            const imgWidth = 215.9; // Letter width in mm
            const pageHeight = 279.4; // Letter height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const profile = contract?.profile || {};
            const fileName = `Contrato_${profile.fullname || 'Arrendamiento'}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Por favor intenta de nuevo.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailAddress) return;

        setSendingEmail(true);

        try {
            // Store the email request in Firestore for backend processing
            await firebase.db.collection('emailRequests').add({
                contractId: contract.id,
                tenantId: contract.tenantId,
                recipientEmail: emailAddress,
                type: 'contract',
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            setEmailSent(true);
            setTimeout(() => {
                setShowEmailModal(false);
                setEmailSent(false);
                setEmailAddress('');
            }, 2000);
        } catch (error) {
            console.error('Error sending email request:', error);
            alert('Error al enviar la solicitud. Por favor intenta de nuevo.');
        } finally {
            setSendingEmail(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center">
                    <h3>Cargando contrato...</h3>
                </div>
            );
        }

        if (!contract) {
            return (
                <div className="alert alert-danger">Contrato no encontrado</div>
            );
        }

        return renderContract();
    };

    const renderContract = () => {
        const data = contract?.data || {};
        const profile = contract?.profile || {};
        const endDate = calculateEndDate(data.startDate, data.duration);

        return (
            <>
                {/* Encabezado del contrato */}
                <div className="text-center" style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontWeight: 'bold', letterSpacing: '3px' }}>CONTRATO DE ARRENDAMIENTO</h2>
                    <hr style={{ width: '100px', borderTop: '3px solid #b8860b', margin: '15px auto' }} />
                </div>

                {/* Contenido del contrato */}
                <div
                    ref={contractRef}
                    style={{
                        backgroundColor: 'white',
                        padding: '40px',
                        border: '1px solid #ddd',
                        fontSize: '12px',
                        lineHeight: '1.8',
                        textAlign: 'justify'
                    }}>
                    {/* Preámbulo */}
                    <p style={{ textTransform: 'uppercase' }}>
                        CONTRATO DE ARRENDAMIENTO CELEBRADO EL DÍA <strong>{getDay(data.startDate)}</strong> DE <strong>{getMonth(data.startDate)}</strong> DEL AÑO <strong>{getYear(data.startDate)}</strong> AL QUE SE OBLIGAN: POR UNA PARTE, EL SEÑOR <strong>JOSE LUIS PALILLERO HUERTA</strong>, POR DERECHO PROPIO, Y QUIEN SE IDENTIFICA A TRAVÉS DE SU CREDENCIAL PARA VOTAR CON NÚMERO DE FOLIO 0956046863508820621 EXPEDIDA POR EL INSTITUTO NACIONAL ELECTORAL –I.N.E.- A QUIÉN EN LO SUCESIVO SE LE DENOMINARÁ "EL ARRENDADOR" Y POR LA OTRA PARTE A <strong>{profile.fullname || '________________________________'}</strong>, POR DERECHO PROPIO Y QUIEN SE IDENTIFICA A TRAVÉS DE SU CREDENCIAL PARA VOTAR CON NÚMERO DE FOLIO <strong>{data.tenantId || '______________________'}</strong> EXPEDIDA POR EL INSTITUTO NACIONAL ELECTORAL –I.N.E.- A QUIÉN EN LO SUCESIVO SE LE DENOMINARÁ "LA ARRENDATARIA". ASIMISMO EN SU CARÁCTER DE "FIADOR" COMPARECE EL(LA) SEÑOR(A) <strong>{data.guarantorName || '___________________________________'}</strong>, POR DERECHO PROPIO, Y QUIEN SE IDENTIFICA A TRAVÉS DE SU CREDENCIAL PARA VOTAR CON NÚMERO DE FOLIO <strong>{data.guarantorId || '______________________'}</strong> EXPEDIDA POR EL INSTITUTO NACIONAL ELECTORAL –I.N.E.-. AGREGÁNDOSE UNA COPIA SIMPLE DE DICHOS DOCUMENTOS COMO ANEXOS AL PRESENTE CONTRATO, SUJETÁNDOSE LOS CONTRATANTES AL TENOR DE LAS SIGUIENTES CLÁUSULAS:
                    </p>

                    {/* DECLARACIONES */}
                    <h4 style={{ textAlign: 'center', marginTop: '30px', fontWeight: 'bold' }}>DECLARACIONES</h4>

                    <p><strong>I.- Declara "EL ARRENDADOR":</strong></p>
                    <div style={{ paddingLeft: '20px' }}>
                        <p>a) Ser mayor de edad, sin impedimento legal para contratar.</p>
                        <p>b) Que puede ejercer actos de administración sobre el inmueble ubicado frente a la calle Ciencias de la Salud número 16, departamento <strong>{data.department || '___'}</strong>, Sección Tercera Guardia, Zacatelco, Tlaxcala; al cual se le denominará en el contrato "el inmueble".</p>
                        <p>c) Que es su deseo dar en arrendamiento el inmueble descrito en el inciso b) a "LA ARRENDATARIA", de conformidad con los términos y condiciones del presente contrato.</p>
                        <p>d) Que dicho "inmueble" no presenta o sufre vicios o defectos y por lo tanto, se encuentra en buenas condiciones para utilizarse como CASA-HABITACIÓN.</p>
                    </div>

                    <p style={{ marginTop: '20px' }}><strong>II. Declara "LA ARRENDATARIA":</strong></p>
                    <div style={{ paddingLeft: '20px' }}>
                        <p>a) Ser mayor de edad, sin impedimento legal para contratar.</p>
                        <p>b) Que conoce el estado del inmueble objeto del arrendamiento y el mismo cumple con sus necesidades.</p>
                        <p>c) Que tiene interés en arrendar el inmueble descrito en la declaración I, inciso b) anterior, y cuenta con la solvencia económica para obligarse en los términos de este contrato.</p>
                        <p>d) Que ha constatado personalmente las condiciones físicas del inmueble, razón por la cual manifiesta su conformidad en cuanto a las mismas; por lo que considera que este reúne los requisitos de seguridad e higiene suficientes para utilizar el inmueble como CASA-HABITACIÓN.</p>
                        <p>e) Que se compromete a respetar todas y cada una de las reglas de convivencia, del listado que se agrega en copia simple de dicho documento como anexo al presente contrato. Ya que de no respetarlas "EL ARRENDADOR" podrá rescindir sin responsabilidad alguna para él dicho contrato.</p>
                    </div>

                    <p style={{ marginTop: '20px' }}><strong>III. Declaran "LAS PARTES":</strong></p>
                    <div style={{ paddingLeft: '20px' }}>
                        <p>a) Que es su deseo celebrar este contrato.</p>
                        <p>b) Que el presente documento no ha sido afectado por dolo, lesión, mala fe, reticencia ni algún otro vicio del consentimiento.</p>
                        <p>c) Que conocen el estado que guarda el inmueble, y a su juicio se encuentra libre de vicios y cubre las necesidades de LA ARRENDATARIA.</p>
                        <p>d) Que no existe impedimento o causa legal que limite a "LA ARRENDATARIA" el uso e instalación de los servicios de agua, luz, gas, entre otros, y en el momento en que se dé por terminada la relación de arrendamiento pasarán a formar parte integrante del mencionado inmueble arrendado.</p>
                        <p>e) "LA ARRENDATARIA" que recibe el inmueble descrito en la declaración I, inciso b) para ser destinado únicamente como casa habitación, deslindando a "EL ARRENDADOR" de cualquier responsabilidad que pudiera derivarse del uso indebido del inmueble, entre ellas la realización de actividades ilícitas.</p>
                    </div>

                    {/* CLÁUSULAS */}
                    <h4 style={{ textAlign: 'center', marginTop: '30px', fontWeight: 'bold' }}>CLÁUSULAS</h4>

                    <p><strong>PRIMERA.- OBJETO DEL CONTRATO.</strong> Las partes contratantes se obligan recíprocamente, "EL ARRENDADOR", a conceder el uso temporal del inmueble descrito en la declaración I, inciso b), y "LA ARRENDATARIA", a pagar mensualmente, por ese uso, la cantidad de <strong>{formatCurrency(data.monthlyRent)}</strong>, con el Impuesto al Valor Agregado incluido, por lo que cada mes entregará a "EL ARRENDADOR" la cantidad de <strong>{formatCurrency(data.monthlyRent)}</strong> ó a quién legalmente lo represente en la Calle Ciencias de la Salud número 16, Tercera Sección Guardia, Zacatelco, Tlaxcala, dentro de los posteriores cinco días hábiles de la fecha de vencimiento; en su caso, en la inteligencia que de no pagar en el término establecido, pagará un cinco por ciento (5%) de interés por cada mes ó fracción que pase de los primeros cinco días posteriores a la fecha inicial establecida de cada mes, sobre el precio de cada mensualidad vencida.</p>

                    <p><strong>SEGUNDA.- DESTINO DEL INMUEBLE.</strong> El inmueble materia de este contrato se utilizará exclusivamente para CASA-HABITACIÓN, no pudiendo LA ARRENDATARIA destinarlo a usos distintos de los especificados. Queda prohibido el almacenaje de productos tóxicos o explosivos. "EL ARRENDADOR" no será responsable de la procedencia lícita o de la legítima posesión de los bienes que posea LA ARRENDATARIA, ni asume responsabilidad respecto de la seguridad de los bienes o personas que se encuentren en la localidad arrendada, de sus relaciones con el arrendador, de las infracciones que por la tenencia de los bienes se pudiera cometer, ni de ninguna otra especie. Obligándose "LA ARRENDATARIA" a conservar el inmueble en las condiciones en que lo recibe, bajo pena de pagar los daños y perjuicios que se causen por su omisión.</p>

                    <p><strong>TERCERA.- VIGENCIA.</strong> Este contrato se celebra con vigencia de {data.duration || 'once meses'}, con inicio a partir del día <strong>{getDay(data.startDate)}</strong> de <strong>{getMonth(data.startDate)}</strong> del <strong>{getYear(data.startDate)}</strong> para terminar precisamente el día <strong>{getDay(endDate)}</strong> de <strong>{getMonth(endDate)}</strong> de <strong>{getYear(endDate)}</strong>. Vencido el plazo aquí pactado no se entenderá prorrogado el arrendamiento sino mediante convenio expreso y escrito, debidamente firmado por ambas partes. "LA ARRENDATARIA" renuncia a los derechos consignados en los artículos 30, 2059, 2081 y 2083 del Código Civil para el Estado Libre y Soberano de Tlaxcala.</p>

                    <p><strong>CUARTA.- PAGO DE RENTA.</strong> El pago de la renta deberá hacerse en el domicilio del "EL ARRENDADOR" durante los posteriores cinco días hábiles de cada fecha de vencimiento de cada mes, por mensualidades anticipadas ó a quién legalmente lo represente en la Calle Ciencias de la Salud número 16, Tercera Sección Guardia, Zacatelco, Tlaxcala; y previo pago se hará entrega del recibo. Expresamente conviene "LA ARRENDATARIA" que en todos los meses, la renta la pagará integra aún cuando únicamente ocupe la localidad parcialmente o parte del mes que corresponde.</p>

                    <p><strong>CUARTA BIS.- PAGO DE LOS SERVICIOS.</strong> "LA ARRENDATARIA" se obliga a pagar por su cuenta todos los servicios que requiera, incluida la instalación de los mismos: Se le hace entrega del inmueble arrendado con la instalación necesaria para el alumbrado eléctrico y para el servicio de agua potable en perfectas condiciones, obligándose LA ARRENDATARIA a pagar con toda puntualidad ambos servicios.</p>

                    <p><strong>QUINTA.- DEPÓSITO.</strong> "LA ARRENDATARIA" ha dado en depósito a "EL ARRENDADOR" la cantidad de <strong>{formatCurrency(data.deposit || (parseFloat(data.monthlyRent) * 2))}</strong> por concepto de depósito para garantizar los probables daños o incumplimientos que pudieran causarse y con independencia de la obligación del "FIADOR". "EL ARRENDADOR" se obliga a devolver esta misma cantidad en la misma fecha y hora de la entrega del inmueble con los intereses bancarios correspondientes durante el tiempo que tuvo en su poder dicha cantidad a la terminación del contrato, siempre y cuando "LA ARRENDATARIA" entregue al "ARRENDADOR" el inmueble libre de adeudos.</p>

                    <p><strong>SEXTA.- INCREMENTOS A LA RENTA.</strong> La renta sufrirá revisiones anuales para su incremento, el incremento será conforme al porcentaje del índice Nacional de precios al Consumidor que determine el Banco de México por el año inmediato transcurrido.</p>

                    <p><strong>SÉPTIMA.- SUBARRENDAMIENTO.</strong> "LA ARRENDATARIA" no podrá ceder, traspasar o subarrendar en todo o en parte el inmueble objeto de este contrato. En todo caso, si celebrare subarrendamiento, quedará obligado solidariamente con el subarrendatario.</p>

                    <p><strong>OCTAVA.- RECEPCIÓN DEL INMUEBLE Y REPARACIONES.</strong> "LA ARRENDATARIA" recibe el inmueble y muebles que aparecen en la lista que se agrega en copia simple al presente contrato, en buen estado, sin problemas de gotera y humedad, cuarteadoras, ni vicios ocultos. Será por cuenta de "LA ARRENDATARIA" el llevar a cabo todas las reparaciones de aquellos deterioros que regularmente se causen.</p>

                    <p><strong>NOVENA.- MEJORAS.</strong> Para efectuar toda clase de mejoras, instalaciones o adiciones al local que recibe en arrendamiento, "LA ARRENDATARIA" deberá recabar consentimiento por escrito y debidamente firmado por "EL ARRENDADOR". Las mejoras quedarán a beneficio del inmueble, renunciando al derecho del artículo 2057 del Código Civil para el Estado Libre y Soberano de Tlaxcala.</p>

                    <p><strong>DÉCIMA.- SERVICIOS.</strong> El inmueble cuenta con servicios de muebles, agua, drenaje y luz. "LA ARRENDATARIA" será responsable de cubrir oportunamente los citados servicios.</p>

                    <p><strong>DÉCIMA PRIMERA.- INCUMPLIMIENTOS.</strong> El incumplimiento por cualquiera de las partes de cualquiera de las obligaciones contenidas en este contrato o en la ley, otorgará a la otra parte el derecho de exigir el cumplimiento forzoso o la rescisión del mismo.</p>

                    <p><strong>DÉCIMA SEGUNDA.- TOTALIDAD DEL CONTRATO.</strong> Las partes contratantes manifiestan que quedan obligadas sólo a lo que específicamente se contiene en éste documento.</p>

                    <p><strong>DÉCIMA TERCERA.- RENUNCIAS.</strong> Las partes acuerdan expresamente en que la falta de ejercicio total o parcial de los derechos que le correspondan no implica renuncia posterior a ejercitarlos. "LA ARRENDATARIA" podrá rescindir este contrato mediante aviso por escrito con 30 días de anticipación y con el pago de penalidad de 2 (dos) meses de renta si es dentro del primer semestre.</p>

                    {/* Tabla de multas */}
                    <p><strong>DÉCIMA CUARTA.- MULTAS POR INCUMPLIMIENTO A REGLAS INTERNAS.</strong> Las partes acuerdan expresamente en que la falta del incumplimiento del reglamento interno provocará una multa correspondiente a la siguiente tabla:</p>

                    <table className="table table-bordered" style={{ marginTop: '15px', marginBottom: '15px', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th>Regla</th>
                                <th>Multa</th>
                                <th>Incumplimiento recurrente</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Nivel 1</td>
                                <td>$ 1,000</td>
                                <td>$ 2,000</td>
                            </tr>
                            <tr>
                                <td>Nivel 2</td>
                                <td>$ 500</td>
                                <td>$ 1,000</td>
                            </tr>
                            <tr>
                                <td>Nivel 3</td>
                                <td>$ 200</td>
                                <td>$ 400</td>
                            </tr>
                        </tbody>
                    </table>

                    <p>"LA ARRENDATARIA" deberá de pagar la multa correspondiente para poder seguir con el contrato normalmente.</p>

                    <p><strong>DÉCIMA QUINTA.- INTERCAMBIO DE INMUEBLE.</strong> En el caso de que "EL ARRENDADOR" necesite realizar intercambio del inmueble dentro del edificio, se le notificará a "LA ARRENDATARIA" con un mes de anticipación.</p>

                    <p><strong>DÉCIMA SEXTA.- DESCUENTOS.</strong> Se otorgará descuento en el plazo denominado "inocupación del inmueble" en periodos vacacionales por máximo 1 mes "LA ARRENDATARIA" podrá ser acreedora de un descuento del 25% conforme a lo siguiente:
                        <br />- Si el historial de pagos de renta ha sido saldados en tiempo y forma.
                        <br />- Si no ha tenido multa por contrato vigente.
                        <br />- Si no hay deudas en la renta.
                    </p>

                    <p><strong>DÉCIMA SÉPTIMA.- COMPETENCIA.</strong> El presente contrato se regirá conforme a lo estipulado en los artículos del Código Civil Vigente para el Estado Libre y Soberano de Tlaxcala.</p>

                    <p><strong>DÉCIMA OCTAVA.- TÍTULOS DE LAS CLÁUSULAS.</strong> Los títulos de cada una de las cláusulas han sido insertados para facilitar su lectura.</p>

                    <p><strong>DÉCIMA NOVENA.- FIANZA.</strong> "LA ARRENDATARIA" otorga a favor del "ARRENDADOR" garantía constituida mediante "FIADOR", designado a <strong>{data.guarantorName || '___________________________________'}</strong>, quien otorga su consentimiento firmado. El "FIADOR" responderá solidariamente, renunciando a los beneficios de orden, excusión y división concedidos en los artículos 2429, 2430, 2431 y 2432 del Código Civil para el Estado Libre y Soberano de Tlaxcala.</p>

                    {/* Datos del Fiador */}
                    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                        <h5 style={{ fontWeight: 'bold' }}>DATOS DEL FIADOR</h5>
                        <p><strong>Nombre:</strong> {data.guarantorName || '___________________________________'}</p>
                        <p><strong>Dirección:</strong> {data.guarantorAddress || '___________________________________'}</p>
                        <p><strong>Teléfono:</strong> {data.guarantorPhone || '___________________________________'}</p>
                        <p><strong>Identificación (INE):</strong> {data.guarantorId || '___________________________________'}</p>
                    </div>

                    {/* Cierre */}
                    <p style={{ marginTop: '30px' }}>
                        Bien enteradas las partes, habiendo leído y comprendido el contenido y alcance del presente contrato, lo firman de conformidad por duplicado, quedando asentado el día <strong>{getDay(new Date().toISOString())}</strong> de <strong>{getMonth(new Date().toISOString())}</strong> del año <strong>{getYear(new Date().toISOString())}</strong>, en el Municipio de Zacatelco, Tlaxcala.
                    </p>
                </div>

                {/* Sección de firmas */}
                {contract.status !== 'signed' && (
                    <div style={{ marginTop: '40px', backgroundColor: '#f9f9f9', padding: '30px', border: '1px solid #ddd' }}>
                        {/* Aviso de edición */}
                        <div className="alert alert-warning text-center">
                            <i className="fa fa-exclamation-triangle"></i> <strong>Revisa la información antes de firmar.</strong>
                            <p style={{ marginBottom: 0 }}>Si hay algún dato incorrecto, puedes editarlo antes de firmar.</p>
                            <button
                                onClick={() => history.push(`${ROUTES.MY_CONTRACT}?edit=true`)}
                                className="btn btn-warning"
                                style={{ marginTop: '10px' }}
                            >
                                <i className="fa fa-edit"></i> Editar Información del Contrato
                            </button>
                        </div>

                        <hr />

                        <h4 className="text-center">Firmas Digitales</h4>

                        <div className="row" style={{ marginTop: '30px' }}>
                            <div className="col-md-6">
                                <h5>Firma del Arrendatario</h5>
                                <div style={{ border: '2px solid #333', backgroundColor: 'white', marginTop: '10px' }}>
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        canvasProps={{
                                            width: 400,
                                            height: 150,
                                            className: 'signature-canvas'
                                        }}
                                    />
                                </div>
                                <button onClick={clearSignature} className="btn btn-warning btn-sm" style={{ marginTop: '10px' }}>
                                    Limpiar Firma
                                </button>
                                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{profile.fullname || 'LA ARRENDATARIA'}</p>
                            </div>

                            <div className="col-md-6">
                                <h5>Firma del Aval (Fiador)</h5>
                                <div style={{ border: '2px solid #333', backgroundColor: 'white', marginTop: '10px' }}>
                                    <SignatureCanvas
                                        ref={guarantorSigCanvas}
                                        canvasProps={{
                                            width: 400,
                                            height: 150,
                                            className: 'signature-canvas'
                                        }}
                                    />
                                </div>
                                <button onClick={clearGuarantorSignature} className="btn btn-warning btn-sm" style={{ marginTop: '10px' }}>
                                    Limpiar Firma
                                </button>
                                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{data.guarantorName || 'EL FIADOR'}</p>
                            </div>
                        </div>

                        <div className="text-center" style={{ marginTop: '30px' }}>
                            <button
                                onClick={handleSign}
                                className="btn btn-success btn-lg"
                                disabled={signing}
                            >
                                {signing ? 'Firmando...' : 'Firmar Contrato'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Contrato ya firmado */}
                {contract.status === 'signed' && (
                    <div style={{ marginTop: '40px' }}>
                        <div className="alert alert-success text-center">
                            <h4><i className="fa fa-check-circle"></i> Contrato Firmado</h4>
                            <p><strong>Fecha de firma:</strong> {new Date(contract.signedAt).toLocaleDateString('es-MX', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        {/* Sección de firmas */}
                        <div style={{ backgroundColor: '#f9f9f9', padding: '30px', border: '1px solid #ddd', marginTop: '20px' }}>
                            <h4 className="text-center" style={{ marginBottom: '30px' }}>Firmas del Contrato</h4>

                            <div className="row">
                                {/* Firma del Arrendador */}
                                <div className="col-md-4 text-center">
                                    <h5>EL ARRENDADOR</h5>
                                    <div style={{ border: '1px solid #ddd', backgroundColor: 'white', padding: '10px', marginTop: '10px', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={landlordSignatureImg} alt="Firma del arrendador"
                                            style={{ maxWidth: '100%', maxHeight: '100px' }} />
                                    </div>
                                    <p style={{ marginTop: '10px', fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: '10px' }}>
                                        JOSE LUIS PALILLERO HUERTA
                                    </p>
                                </div>

                                {/* Firma del Arrendatario */}
                                <div className="col-md-4 text-center">
                                    <h5>LA ARRENDATARIA</h5>
                                    <div style={{ border: '1px solid #ddd', backgroundColor: 'white', padding: '10px', marginTop: '10px', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={contract.tenantSignature} alt="Firma del arrendatario"
                                            style={{ maxWidth: '100%', maxHeight: '100px' }} />
                                    </div>
                                    <p style={{ marginTop: '10px', fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: '10px' }}>
                                        {profile.fullname || 'LA ARRENDATARIA'}
                                    </p>
                                </div>

                                {/* Firma del Aval */}
                                <div className="col-md-4 text-center">
                                    <h5>EL FIADOR</h5>
                                    <div style={{ border: '1px solid #ddd', backgroundColor: 'white', padding: '10px', marginTop: '10px', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={contract.guarantorSignature} alt="Firma del aval"
                                            style={{ maxWidth: '100%', maxHeight: '100px' }} />
                                    </div>
                                    <p style={{ marginTop: '10px', fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: '10px' }}>
                                        {data.guarantorName || 'EL FIADOR'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Opciones de descarga y envío */}
                        <div className="text-center" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                            <h5 style={{ marginBottom: '20px' }}>Opciones de Contrato</h5>
                            <button
                                onClick={generatePDF}
                                className="btn btn-success btn-lg"
                                disabled={generatingPdf}
                                style={{ marginRight: '10px' }}
                            >
                                <i className="fa fa-download"></i> {generatingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                            </button>
                            <button
                                onClick={() => setShowEmailModal(true)}
                                className="btn btn-primary btn-lg"
                                style={{ marginRight: '10px' }}
                            >
                                <i className="fa fa-envelope"></i> Enviar por Correo
                            </button>
                            <button onClick={() => window.print()} className="btn btn-default btn-lg">
                                <i className="fa fa-print"></i> Imprimir
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal para enviar por correo */}
                {showEmailModal && (
                    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
                        <div className="modal-dialog" style={{ marginTop: '100px' }}>
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button type="button" className="close" onClick={() => setShowEmailModal(false)}>
                                        <span>&times;</span>
                                    </button>
                                    <h4 className="modal-title">Enviar Contrato por Correo</h4>
                                </div>
                                <form onSubmit={handleSendEmail}>
                                    <div className="modal-body">
                                        {emailSent ? (
                                            <div className="alert alert-success text-center">
                                                <i className="fa fa-check-circle" style={{ fontSize: '48px', color: 'green' }}></i>
                                                <h4>Solicitud Enviada</h4>
                                                <p>Recibirás el contrato en tu correo pronto.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="form-group">
                                                    <label>Correo electrónico</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        value={emailAddress}
                                                        onChange={(e) => setEmailAddress(e.target.value)}
                                                        placeholder="ejemplo@correo.com"
                                                        required
                                                    />
                                                </div>
                                                <p className="text-muted">
                                                    <small>El contrato será enviado en formato PDF al correo indicado.</small>
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {!emailSent && (
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-default" onClick={() => setShowEmailModal(false)}>
                                                Cancelar
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={sendingEmail}>
                                                {sendingEmail ? 'Enviando...' : 'Enviar'}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div>
            <HeaderTE small="true" />
            <div className="fondo-rayas container-fluid">
                <div className="row">
                    <SideBarAdmin email={authUser?.email} />

                    <div className="col-xs-10 col-sm-9 col-md-10">
                        <img src={vectoresFondoImg} className="img-responsive imgfondoadmin" alt="" />
                        <div className="bubble-wrapper row text-center">
                            <div className="col-xs-1">
                                <div className="bubble-triangle"></div>
                            </div>
                            <div className="bubble col-xs-11 col-xs-offset-1 col-md-10 col-md-offset-0 col-lg-9">
                                <h1>·Mi Contrato·</h1>

                                <div id="contrato-viewer" className="panel panel-default">
                                    <div className="panel-body">
                                        {renderContent()}

                                        <div className="gradient-padding">
                                            <div className="gradient"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withRouter(withFirebase(ContractViewer));

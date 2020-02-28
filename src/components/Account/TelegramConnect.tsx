import React, { useState, useEffect } from 'react';

interface TelegramConnectProps {
    firebase: any;
    userId: string;
    currentChatId?: string;
}

const TelegramConnect: React.FC<TelegramConnectProps> = ({ firebase, userId, currentChatId }) => {
    const [chatId, setChatId] = useState<string | undefined>(currentChatId);
    const [connectionCode, setConnectionCode] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

    // Generate unique connection code for this user
    useEffect(() => {
        const code = `${userId.substring(0, 8)}-${Date.now().toString(36)}`;
        setConnectionCode(code);
    }, [userId]);

    // Check if user has been connected (poll every 5 seconds when waiting)
    useEffect(() => {
        let interval: number;

        if (!chatId && checking) {
            interval = setInterval(async () => {
                try {
                    const userDoc = await firebase.db.collection('users').doc(userId).get();
                    const userData = userDoc.data();

                    if (userData?.telegramChatId) {
                        setChatId(userData.telegramChatId);
                        setChecking(false);
                        alert('¡Telegram conectado exitosamente! Ahora recibirás recordatorios de pago.');
                    }
                } catch (error) {
                    console.error('Error checking Telegram connection:', error);
                }
            }, 5000); // Check every 5 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [chatId, checking, firebase, userId]);

    const handleStartConnection = async () => {
        setLoading(true);

        try {
            // Save connection code in Firebase for verification
            await firebase.db.collection('telegramConnections').doc(connectionCode).set({
                userId: userId,
                createdAt: new Date().toISOString(),
                connected: false
            });

            // Open Telegram with deep link
            const botUsername = 'torreel_pagos_bot';
            const telegramUrl = `https://t.me/${botUsername}?start=${connectionCode}`;

            window.open(telegramUrl, '_blank');

            setChecking(true);
            setLoading(false);
        } catch (error) {
            console.error('Error starting Telegram connection:', error);
            alert('Error al iniciar la conexión con Telegram');
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('¿Estás seguro de que deseas desconectar tu cuenta de Telegram?')) {
            return;
        }

        setLoading(true);
        try {
            await firebase.db.collection('users').doc(userId).update({
                telegramChatId: firebase.fieldValue.delete()
            });

            setChatId(undefined);
            setChecking(false);
            alert('Telegram desconectado correctamente');
        } catch (error) {
            console.error('Error disconnecting Telegram:', error);
            alert('Error al desconectar Telegram');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel panel-info" style={{ marginTop: '20px' }}>
            <div className="panel-heading">
                <h4><i className="fa fa-telegram"></i> Notificaciones de Telegram</h4>
            </div>
            <div className="panel-body">
                {chatId ? (
                    // Already connected
                    <div>
                        <div className="alert alert-success">
                            <i className="fa fa-check-circle"></i> Tu cuenta de Telegram está conectada. Recibirás recordatorios automáticos de pago.
                        </div>
                        <p><strong>Chat ID:</strong> {chatId}</p>
                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="btn btn-warning"
                        >
                            {loading ? (
                                <><i className="fa fa-spinner fa-spin"></i> Desconectando...</>
                            ) : (
                                <><i className="fa fa-unlink"></i> Desconectar Telegram</>
                            )}
                        </button>
                    </div>
                ) : checking ? (
                    // Waiting for connection
                    <div>
                        <div className="alert alert-info">
                            <i className="fa fa-spinner fa-spin"></i> Esperando conexión con Telegram...
                        </div>
                        <p>Sigue estos pasos:</p>
                        <ol>
                            <li>Abre el bot de Telegram en la ventana que se abrió</li>
                            <li>Presiona el botón "Iniciar" o escribe <code>/start</code></li>
                            <li>Espera unos segundos mientras verificamos la conexión</li>
                        </ol>
                        <button
                            onClick={() => setChecking(false)}
                            className="btn btn-default"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    // Not connected
                    <div>
                        <div className="alert alert-warning">
                            <i className="fa fa-exclamation-triangle"></i> No tienes Telegram conectado. Conecta tu cuenta para recibir recordatorios automáticos de pago.
                        </div>
                        <p>
                            <strong>¿Por qué conectar Telegram?</strong>
                        </p>
                        <ul>
                            <li>Recibe recordatorios automáticos antes de tu fecha de pago</li>
                            <li>Notificaciones cuando tu pago ha sido verificado</li>
                            <li>Avisos importantes sobre tu contrato</li>
                        </ul>
                        <button
                            onClick={handleStartConnection}
                            disabled={loading}
                            className="btn btn-primary btn-lg"
                            style={{ backgroundColor: '#0088cc', borderColor: '#0088cc' }}
                        >
                            {loading ? (
                                <><i className="fa fa-spinner fa-spin"></i> Conectando...</>
                            ) : (
                                <><i className="fa fa-telegram"></i> Conectar Telegram</>
                            )}
                        </button>
                        <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                            Al conectar, se abrirá Telegram y deberás iniciar una conversación con nuestro bot.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TelegramConnect;

import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthUserContext } from '../components/Session';

/**
 * Custom hook para manejar autenticación de Firebase
 * Proporciona el usuario actual y función para obtener token
 */
export const useFirebaseAuth = () => {
    const authUser = useContext(AuthUserContext);

    /**
     * Obtiene el token de autenticación del usuario actual
     * Útil para llamadas a Firebase Functions protegidas
     */
    const getAuthToken = useCallback(async (): Promise<string | null> => {
        if (!authUser) {
            return null;
        }

        try {
            // El usuario de Firebase Auth tiene método getIdToken
            const token = await (authUser as any).getIdToken?.();
            return token || null;
        } catch (error) {
            console.error('Error obteniendo token:', error);
            return null;
        }
    }, [authUser]);

    return {
        user: authUser,
        isAuthenticated: !!authUser,
        getAuthToken,
    };
};

/**
 * Hook para obtener solo el estado de autenticación
 */
export const useAuthState = () => {
    const authUser = useContext(AuthUserContext);

    return {
        isAuthenticated: !!authUser,
        isLoading: authUser === undefined,
        user: authUser,
    };
};

export default useFirebaseAuth;

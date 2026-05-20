import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

function decodeJwtPayload(token) {
    try {
        const payload = token?.split(".")?.[1];
        if (!payload) return null;
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(window.atob(normalized));
    } catch (_) {
        return null;
    }
}

function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
}

function clearStoredAuth() {
    localStorage.removeItem("dg_token");
    localStorage.removeItem("dg_user");
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem("dg_user");
        const token = localStorage.getItem("dg_token");
        if (!raw || !token || isTokenExpired(token)) {
            clearStoredAuth();
            setReady(true);
            return;
        }

        try {
            setUser(JSON.parse(raw));
        } catch (_) {
            clearStoredAuth();
        }
        setReady(true);
    }, []);

    const login = (loginResp) => {
        if (!loginResp?.token || isTokenExpired(loginResp.token)) {
            clearStoredAuth();
            setUser(null);
            return;
        }
        localStorage.setItem("dg_token", loginResp.token);
        localStorage.setItem("dg_user", JSON.stringify(loginResp));
        setUser(loginResp);
    };

    const logout = () => {
        clearStoredAuth();
        setUser(null);
    };

    const refreshAuth = (newToken, newEmail) => {
        if (!newToken || isTokenExpired(newToken)) return;
        localStorage.setItem("dg_token", newToken);
        const raw = localStorage.getItem("dg_user");
        if (raw) {
            try {
                const userObj = JSON.parse(raw);
                userObj.token = newToken;
                if (newEmail) {
                    userObj.email = newEmail;
                    userObj.contactEmail = newEmail;
                    userObj.contact_email = newEmail;
                }
                localStorage.setItem("dg_user", JSON.stringify(userObj));
                setUser(userObj);
            } catch (_) {}
        }
    };

    return (
        <AuthCtx.Provider value={{ user, ready, login, logout, refreshAuth }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);

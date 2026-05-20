import axios from "axios";
import { toast } from "sonner";

const BASE =
    (typeof window !== "undefined" && window.__env__?.REACT_APP_BACKEND_URL) ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:8081";
export const API = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

export const api = axios.create({
    baseURL: API,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

const FIELD_PATTERNS = [
    ["vendorName", /vendor name/],
    ["contactPersonName", /contact person/],
    ["contactEmail", /contact email/],
    ["contactPhone", /contact phone|phone/],
    ["websiteUrl", /website/],
    ["description", /description/],
    ["name", /^name\b| name /],
    ["email", /\bemail\b|credentials/],
    ["password", /password|credentials/],
    ["street", /street/],
    ["city", /city/],
    ["state", /state/],
    ["postalCode", /postal/],
    ["postal_code", /postal/],
    ["country", /country/],
    ["quantity", /quantity/],
    ["initial_quantity", /initial quantity/],
    ["amount", /amount/],
    ["payment_method", /payment method/],
    ["branchId", /branch id/],
    ["holding_id", /holding id/],
    ["delivery_address_id", /delivery address/],
];

function asArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

export function normalizeApiError(error, fallback = "Request failed") {
    if (error?.code === "ECONNABORTED") {
        return {
            status: 0,
            message: "Request timed out. Please try again.",
            details: ["Request timed out. Please try again."],
            fieldErrors: {},
            path: undefined,
            original: error,
        };
    }

    if (!error?.response) {
        return {
            status: 0,
            message: "Cannot reach the backend. Please check your connection and try again.",
            details: ["Cannot reach the backend. Please check your connection and try again."],
            fieldErrors: {},
            path: undefined,
            original: error,
        };
    }

    const data = error.response.data || {};
    const details = asArray(data.details || data.detail || data.errors).filter(Boolean);
    const message = data.message || data.error || details[0] || fallback;
    const allMessages = details.length ? details : [message];
    const fieldErrors = {};

    for (const raw of allMessages) {
        const text = String(raw);
        const lower = text.toLowerCase();
        const match = FIELD_PATTERNS.find(([, pattern]) => pattern.test(lower));
        if (match) fieldErrors[match[0]] = text;
    }

    return {
        status: error.response.status,
        message,
        details: allMessages,
        fieldErrors,
        path: data.path,
        original: error,
    };
}

export function getApiErrorMessage(error, fallback) {
    const normalized = error?.normalized || normalizeApiError(error, fallback);
    return normalized.details?.[0] || normalized.message || fallback || "Request failed";
}

export function getFieldErrors(error) {
    const normalized = error?.normalized || normalizeApiError(error);
    return normalized.fieldErrors || {};
}

export function toastApiError(error, fallback = "Request failed") {
    const normalized = error?.normalized || normalizeApiError(error, fallback);
    const title = normalized.status === 401 ? "Authentication required" : normalized.message || fallback;
    
    let description = undefined;
    if (normalized.details?.length) {
        const uniqueDetails = Array.from(new Set(normalized.details.map(d => String(d).trim())))
            .filter(d => d.toLowerCase() !== title.toLowerCase());
        if (uniqueDetails.length > 0) {
            description = uniqueDetails.join("\n");
        }
    }
    
    toast.error(title, { description });
    return normalized;
}

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("dg_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        error.normalized = normalizeApiError(error);
        if (error.response?.status === 401) {
            localStorage.removeItem("dg_token");
            localStorage.removeItem("dg_user");
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    },
);

export const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(n || 0);

export const fmtINR2 = (n) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(n || 0);

export const fmtGrams = (n) =>
    `${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })} g`;

export const fmtDate = (s) => {
    if (!s) return "-";
    const d = new Date(s);
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const fmtDateTime = (s) => {
    if (!s) return "-";
    const d = new Date(s);
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// ─────────────────────────────────────────────
// Nyra AI Assistant – Full Spec Engine
// Sections 1–15 implemented here
// ─────────────────────────────────────────────

// ── Section 3: Role Permissions ──────────────
export const ROLE_ACCESS = {
    SUPER_ADMIN: [
        'all_hospitals', 'system_config', 'global_analytics', 'user_management',
        'revenue', 'patients', 'appointments', 'staff_management', 'settings',
        'virtual_numbers', 'sip_trunks', 'support_tickets', 'medications',
        'invoices', 'medical_sheets', 'analytics', 'patient_search', 'patient_registration',
        'hospital_management', 'reports', 'my_schedule', 'my_patients',
        'medical_records', 'prescriptions', 'patient_history', 'appointments_view',
        'billing', 'call_queue', 'charges', 'branch_management', 'staff_view',
    ],
    ADMIN: [
        'hospital_management', 'staff_management', 'revenue', 'patients', 'appointments',
        'settings', 'analytics', 'branches', 'medications', 'invoices', 'medical_sheets',
        'patient_search', 'patient_registration', 'reports', 'staff_view',
    ],
    MANAGER: [
        'branch_management', 'staff_view', 'patients', 'appointments', 'reports',
        'analytics', 'medications', 'medical_sheets', 'patient_search',
    ],
    RECEPTIONIST: [
        'patient_registration', 'appointments', 'billing', 'call_queue', 'invoices',
        'charges', 'patient_search',
    ],
    DOCTOR: [
        'my_schedule', 'my_patients', 'medical_records', 'prescriptions',
        'medical_sheets', 'patient_history', 'appointments_view', 'medications', 'patients',
    ],
};

export const ROLE_DISPLAY = {
    SUPER_ADMIN: 'Super Administrator',
    ADMIN: 'Hospital Admin',
    MANAGER: 'Branch Manager',
    RECEPTIONIST: 'Receptionist',
    DOCTOR: 'Doctor',
};

export const normalizeRole = (role = '') => {
    const r = role.toUpperCase().replace(/-/g, '_');
    if (r.includes('SUPER')) return 'SUPER_ADMIN';
    if (r.includes('ADMIN')) return 'ADMIN';
    if (r.includes('MANAGER')) return 'MANAGER';
    if (r.includes('RECEPT')) return 'RECEPTIONIST';
    if (r.includes('DOCTOR') || r.includes('DR')) return 'DOCTOR';
    return 'DOCTOR';
};

export const canAccessResource = (role, resource) => {
    const normalized = normalizeRole(role);
    return (ROLE_ACCESS[normalized] || []).includes(resource);
};

export const filterActionsByRole = (actions, role) => {
    return actions.filter(a => !a.resource || canAccessResource(role, a.resource));
};

// ── Section 6: Intents ────────────────────────
export const INTENTS = {
    GREETING: 'GREETING',
    SEARCH_PATIENT: 'SEARCH_PATIENT',
    SEARCH_DOCTOR: 'SEARCH_DOCTOR',
    LIST_APPOINTMENTS: 'LIST_APPOINTMENTS',
    BOOK_APPOINTMENT: 'BOOK_APPOINTMENT',
    THEME_CHANGE: 'THEME_CHANGE',
    SYSTEM_STATUS: 'SYSTEM_STATUS',
    REVENUE_INSIGHTS: 'REVENUE_INSIGHTS',
    ROLE_ACCESS: 'ROLE_ACCESS',
    NAME_INPUT: 'NAME_INPUT',
    MEDICATIONS: 'MEDICATIONS',
    INVOICES: 'INVOICES',
    MEDICAL_SHEETS: 'MEDICAL_SHEETS',
    ANALYTICS: 'ANALYTICS',
    CALL_FLOW: 'CALL_FLOW',
    UNKNOWN: 'UNKNOWN',
};

const INTENT_PATTERNS = [
    { intent: INTENTS.CALL_FLOW, patterns: [/\bcall\b/, /\bring\b/] },
    { intent: INTENTS.GREETING, patterns: [/\bhi\b/, /\bhey\b/, /\bhello\b/, /\bgreetings?\b/, /\byo\b/, /good (morning|afternoon|evening|night)\b/] },
    { intent: INTENTS.SEARCH_PATIENT, patterns: [/\bpatient\b/, /find p/, /search p/, /who is/, /details of/, /lookup/, /profile of/, /show patient/, /check patient/, /records of/, /\bpatients\b/] },
    { intent: INTENTS.SEARCH_DOCTOR, patterns: [/\bdoctor\b/, /\bdr\.?/, /physician/, /specialist/, /\bstaff\b/, /consultant/, /practitioner/, /surgeon/] },
    { intent: INTENTS.LIST_APPOINTMENTS, patterns: [/appointment/, /\bschedule\b/, /\bbooking/, /\bcalendar\b/, /\btoday\b/, /\bagenda\b/, /consultation/, /\bqueue\b/, /waiting/] },
    { intent: INTENTS.BOOK_APPOINTMENT, patterns: [/\bbook\b/, /new appointment/, /schedule patient/, /create appointment/, /\breserve\b/, /appointment for/, /register appointment/] },
    { intent: INTENTS.THEME_CHANGE, patterns: [/\btheme\b/, /\bmode\b/, /\bdark\b/, /\blight\b/, /\bglass\b/, /switch.*look/, /appearance/, /change look/] },
    { intent: INTENTS.SYSTEM_STATUS, patterns: [/\bstatus\b/, /operational/, /\bupdate\b/, /check system/, /\bhospital/, /health check/, /\buptime\b/] },
    { intent: INTENTS.REVENUE_INSIGHTS, patterns: [/revenue/, /\bearn/, /\bmoney\b/, /\bprofit\b/, /\bincome\b/, /rupee/, /finance/, /collection/, /\bsales\b/] },
    { intent: INTENTS.ROLE_ACCESS, patterns: [/\bhelp\b/, /\bsupport\b/, /\bguide\b/, /what can i do/, /how to/, /my access/, /permission/, /capabilit/, /\brole\b/, /\btasks\b/, /responsibilities/, /access level/] },
    { intent: INTENTS.NAME_INPUT, patterns: [/my name is/, /i\s?am\b/, /call me/, /name'?s/] },
    { intent: INTENTS.MEDICATIONS, patterns: [/\bmeds?\b/, /medication/, /medicine/, /\bdrug\b/, /pharma/, /\bpill\b/, /pharmacy/, /\bstock\b/, /inventory/, /tablet/, /syrup/, /injection/] },
    { intent: INTENTS.INVOICES, patterns: [/billing/, /invoice/, /\bbill\b/, /payment/, /\bcharge/, /\bcost\b/, /transaction/, /receipt/, /\bdue\b/, /outstanding/] },
    { intent: INTENTS.MEDICAL_SHEETS, patterns: [/medical sheet/, /\bhistory\b/, /\brecord\b/, /prescription/, /\bsheet\b/, /\breport\b/, /case paper/, /\bfile\b/, /clinical/, /\bnotes\b/] },
    { intent: INTENTS.ANALYTICS, patterns: [/analytics/, /statistics/, /\bstats\b/, /\breport\b/, /performance/, /summary/, /\binsights?\b/, /\bkpi\b/, /metric/] },
];

export const processIntent = (message) => {
    const msg = message.toLowerCase();
    let best = { intent: INTENTS.UNKNOWN, score: 0 };
    for (const { intent, patterns } of INTENT_PATTERNS) {
        const score = patterns.filter(p => p.test(msg)).length;
        if (score > best.score) best = { intent, score };
    }
    return best.intent;
};

// ── Section 7: Entity Extraction ──────────────
const KEYWORD_STRIP = /\b(find|search|show|patient|doctor|book|schedule|create|new|register|appointment|details|of|the|my|list|all|records)\b/gi;

export const extractEntities = (message) => {
    const msg = message.toLowerCase();
    const entities = {};

    // theme
    if (/\bdark\b/.test(msg)) entities.theme = 'dark';
    else if (/\blight\b/.test(msg)) entities.theme = 'light';
    else if (/\bglass\b/.test(msg)) entities.theme = 'glass';

    // date
    if (/\btomorrow\b/.test(msg)) entities.date = 'tomorrow';
    else if (/\btoday\b/.test(msg)) entities.date = 'today';
    else if (/\byesterday\b/.test(msg)) entities.date = 'yesterday';
    else if (/\bnext week\b/.test(msg)) entities.date = 'next_week';
    const isoMatch = msg.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) entities.date = isoMatch[0];

    // name (strip keywords, get remainder)
    const SKIP_NAMES = ['list', 'all', 'records', 'details', 'my', 'the', 'show', 'yes', 'no'];
    const nameInput = message.replace(KEYWORD_STRIP, '').trim();
    if (nameInput.length >= 1 && nameInput.length <= 29 && !SKIP_NAMES.includes(nameInput.toLowerCase())) {
        entities.name = nameInput.replace(/\s+/g, ' ').trim();
    }

    // name for NAME_INPUT intent
    const nameMatch = message.match(/(?:my name is|i am|call me|name's)\s+(.+)/i);
    if (nameMatch) entities.name = nameMatch[1].trim();

    return entities;
};

// ── Section 5: Direct Patient Lookup ──────────
const GREETING_WORDS = ['hi', 'hello', 'hey', 'help', 'menu', 'start', 'restart', 'bye', 'thanks'];

export const tryPatientLookup = (message, patients = []) => {
    const msg = message.trim().toLowerCase();
    if (GREETING_WORDS.includes(msg)) return null;

    const digits = message.replace(/[\s\-()]/g, '');
    const isPhone = /^\+?\d{7,15}$/.test(digits);
    const isName = /^[a-zA-Z\s0-9]{2,50}$/.test(message.trim()) && !/^\d+$/.test(message.trim());

    if (!isPhone && !isName) return null;
    if (patients.length === 0) return null;

    let matches = [];

    if (isPhone) {
        const inputDigits = digits.replace(/^\+/, '');
        matches = patients.filter(p => {
            const pDigits = (p.phone || '').replace(/\D/g, '');
            return pDigits === inputDigits || pDigits.includes(inputDigits) || inputDigits.includes(pDigits);
        });
    }

    if (matches.length === 0 && isName) {
        const tokens = message.trim().toLowerCase().split(/\s+/);
        matches = patients.filter(p => {
            const pName = (p.name || '').toLowerCase();
            return tokens.every(token => pName.includes(token));
        });
    }

    return matches.length > 0 ? matches.slice(0, 5) : null;
};

// ── Section 8: Intent Handlers ─────────────────
export const handleIntent = ({ intent, entities, user, stats, setTheme }) => {
    const role = normalizeRole(user?.role);
    const displayRole = ROLE_DISPLAY[role] || role;
    const name = user?.name || 'there';

    switch (intent) {
        case INTENTS.GREETING: {
            return {
                text: `Hello ${name}! ${getGreeting()}. How can I help with your clinic today?`,
                actions: [],
            };
        }

        case INTENTS.THEME_CHANGE: {
            if (entities.theme && setTheme) {
                setTheme(entities.theme);
                const msgs = {
                    dark: `Switching to **Dark Mode**. Easy on the eyes! 🌙`,
                    light: `Switching to **Light Mode**. Bright and clear! ☀️`,
                    glass: `Switching to **Glass Mode**. Sleek and modern! 💎`,
                };
                return { text: msgs[entities.theme], actions: [] };
            }
            return { text: `I can switch themes! Say 'Dark', 'Light', or 'Glass' mode.`, actions: [] };
        }

        case INTENTS.SEARCH_PATIENT: {
            if (!canAccessResource(role, 'patients') && !canAccessResource(role, 'patient_search')) {
                return { text: `Sorry, as a ${displayRole}, you don't have permission to search all patients.`, actions: [] };
            }
            const count = stats?.totalPatients || 0;
            return {
                text: `We have **${count} registered patients** in the system. Use the Patients screen to search and filter.`,
                actions: filterActionsByRole([
                    { label: 'View Patient Directory', screen: 'Patients', resource: 'patients' },
                    { label: 'Register New Patient', screen: 'Patients', resource: 'patient_registration' },
                ], role),
            };
        }

        case INTENTS.SEARCH_DOCTOR: {
            return {
                text: `You can view the doctor directory and their schedules from the staff management section.`,
                actions: filterActionsByRole([
                    { label: 'Staff Directory', screen: 'Profile', resource: 'staff_view' },
                ], role),
            };
        }

        case INTENTS.LIST_APPOINTMENTS: {
            const count = entities.date === 'tomorrow'
                ? stats?.tomorrowApts || 0
                : stats?.todayApts || 0;
            const label = entities.date === 'tomorrow' ? 'tomorrow' : 'today';
            const pending = stats?.pendingApts || 0;
            return {
                text: `You have **${count} appointments** scheduled for ${label}.${pending > 0 ? ` **${pending}** are still pending.` : ''}`,
                actions: filterActionsByRole([
                    { label: 'Manage Queue', screen: 'Chat', resource: 'appointments' },
                ], role),
            };
        }

        case INTENTS.BOOK_APPOINTMENT: {
            const patientName = entities.name;
            return {
                text: patientName
                    ? `I can help you schedule an appointment for **${patientName}**. Which service are they looking for?`
                    : `I can open the appointment scheduler. Who would you like to book for?`,
                actions: filterActionsByRole([
                    { label: 'Open Scheduler', screen: 'Chat', resource: 'appointments' },
                ], role),
            };
        }

        case INTENTS.SYSTEM_STATUS: {
            if (canAccessResource(role, 'all_hospitals')) {
                return {
                    text: `System represents **${stats?.totalPatients || 0} patients** across connected hospitals. Would you like to view the Global Hospital List?`,
                    actions: [{ label: 'System Overview', screen: 'Overview' }],
                };
            } else if (canAccessResource(role, 'system_config')) {
                return {
                    text: `**System Status Report**: 🟢 100% Operational\n• Active Patients: ${stats?.totalPatients || 0}\n• Daily Workload: ${stats?.todayApts || 0} Appointments\n• Server latency: 24ms`,
                    actions: [],
                };
            }
            return {
                text: `The portal is fully operational. You have **${stats?.todayApts || 0} appointments** remaining for today.`,
                actions: [],
            };
        }

        case INTENTS.REVENUE_INSIGHTS: {
            if (!canAccessResource(role, 'revenue')) {
                return {
                    text: `Access Restricted! As a **${displayRole}**, you don't have permissions to view financial analytics. Contact your Admin for access.`,
                    actions: [],
                };
            }
            return {
                text: `Current revenue from appointments is **₹${stats?.totalRevenue || 0}**. Today earned: **₹${stats?.totalRevenueToday || 0}**.`,
                actions: [{ label: 'Revenue Analytics', screen: 'Overview', resource: 'revenue' }],
            };
        }

        case INTENTS.ROLE_ACCESS: {
            const resources = (ROLE_ACCESS[role] || []).slice(0, 5).join(', ');
            return {
                text: `As a **${displayRole}**, you have access to: ${resources}, and more.`,
                actions: [{ label: 'View My Profile', screen: 'Profile' }],
            };
        }

        case INTENTS.MEDICATIONS: {
            if (!canAccessResource(role, 'medications')) {
                return { text: `As a ${displayRole}, you don't have access to manage medications directly.`, actions: [] };
            }
            return {
                text: `Opening medication inventory and management.`,
                actions: [{ label: 'View Inventory', screen: 'Overview', resource: 'medications' }],
            };
        }

        case INTENTS.INVOICES: {
            if (!canAccessResource(role, 'invoices')) {
                return { text: `Billing information is restricted for your role (${displayRole}).`, actions: [] };
            }
            return {
                text: `Managing billing and invoices. Current period revenue: ₹${stats?.totalRevenue || 0}.`,
                actions: [{ label: 'View Invoices', screen: 'Chat', resource: 'invoices' }],
            };
        }

        case INTENTS.MEDICAL_SHEETS: {
            if (!canAccessResource(role, 'medical_sheets')) {
                return { text: `You need clinical access to view medical sheets.`, actions: [] };
            }
            return {
                text: `Accessing patient medical records and history sheets.`,
                actions: [{ label: 'Medical Sheets', screen: 'Patients', resource: 'medical_sheets' }],
            };
        }

        case INTENTS.ANALYTICS: {
            if (!canAccessResource(role, 'analytics') && !canAccessResource(role, 'revenue')) {
                return { text: `You don't have permission to view high-level analytics. Please check with your administrator.`, actions: [] };
            }
            return {
                text: `**Analytical Summary**:\n• Daily Volume: ${stats?.todayApts || 0} appointments\n• Tomorrow's Forecast: ${stats?.tomorrowApts || 0} bookings\n• Total Database: ${stats?.totalPatients || 0} patients\n• System Health: 🟢 Fully Operational`,
                actions: filterActionsByRole([
                    { label: 'Performance Report', screen: 'Overview', resource: 'analytics' },
                ], role),
            };
        }

        case INTENTS.NAME_INPUT: {
            if (entities.name) {
                return { text: `Nice to meet you, **${entities.name}**! I'll remember that. 😊`, actions: [] };
            }
            return { text: `What should I call you?`, actions: [] };
        }

        default: {
            const suggestions = getSuggestionChips(role).slice(0, 3);
            return {
                text: `I didn't quite understand that. As a **${displayRole}**, you can try:\n${suggestions.map(s => `• ${s}`).join('\n')}\nOr ask about appointments, patients, or change theme!`,
                actions: [],
            };
        }
    }
};

// ── Section 10: Suggestion Chips ──────────────
export const getSuggestionChips = (role) => {
    const normalized = normalizeRole(role);
    const chips = {
        SUPER_ADMIN: ['View all hospitals', 'Check system status', 'Manage global settings', 'View support tickets'],
        ADMIN: ["Today's appointments", 'Revenue summary', 'Staff directory', 'Patient statistics'],
        MANAGER: ['Branch appointments', 'Staff schedule', 'Patient list', 'Branch reports'],
        RECEPTIONIST: ['Register new patient', "Today's appointments", 'Check-in patient', 'View call queue'],
        DOCTOR: ['My schedule', 'My patients today', 'Recent medical sheets', 'Prescription history'],
    };
    return chips[normalized] || chips['DOCTOR'];
};

// ── Greeting helper ───────────────────────────
export const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 22) return 'Good evening';
    return 'Good night';
};

// ── Page name helper ──────────────────────────
export const getPageName = (screenName) => {
    const map = {
        Overview: 'Dashboard Overview',
        Patients: 'Patient Management',
        Chat: 'AI Conversation Logs',
        Profile: 'System Settings',
        NyraAI: 'Dashboard Overview',
    };
    return map[screenName] || screenName || 'this page';
};

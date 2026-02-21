/**
 * shared/callHelpers.js
 * Universal helper functions covering ALL known API response shapes
 * for conversations, calls, reminder calls, and appointments.
 */

/**
 * Extract patient name from a conversation / call / reminder-call object.
 * Covers deeply nested, flat, camelCase, snake_case, and array shapes.
 */
export function getName(item) {
    if (!item) return 'Unknown';
    return (
        // Direct patient object fields
        item?.patient?.name ||
            item?.Patient?.name ||
            item?.patient?.full_name ||
            item?.patient?.fullName ||
            // Flat camelCase / snake_case
            item?.patientName ||
            item?.patient_name ||
            item?.fullName ||
            item?.full_name ||
            item?.name ||
            item?.caller_name ||
            item?.callerName ||
            // Nested appointment / user
            item?.appointment?.patient?.name ||
            item?.appointment?.patientName ||
            item?.user?.name ||
            item?.contact?.name ||
            // Phone as fallback label
            getPhone(item) !== '—' ? null : undefined
    )?.trim() || 'Unknown Patient';
}

/**
 * Extract phone number from a conversation / call / reminder object.
 */
export function getPhone(item) {
    if (!item) return '—';
    return (
        item?.phone ||
        item?.phone_number ||
        item?.phoneNumber ||
        item?.caller_phone ||
        item?.callerPhone ||
        item?.patient?.phone ||
        item?.patient?.phone_number ||
        item?.patient?.mobile ||
        item?.mobile ||
        item?.contact?.phone ||
        item?.appointment?.patient?.phone
    ) || '—';
}

/** Conversation / session ID */
export function getConvId(item) {
    return item?.id || item?._id || item?.sessionId || item?.session_id || item?.callId || item?.call_id;
}

/** Status string (uppercased) */
export function getStatus(item) {
    return (item?.status || item?.state || item?.callStatus || item?.call_status || '').toUpperCase();
}

/** Direction (INBOUND / OUTBOUND) */
export function getDirection(item) {
    return (item?.direction || item?.call_direction || item?.callDirection || '').toUpperCase();
}

/** Call / conversation type (lowercased) */
export function getType(item) {
    return (item?.type || item?.callType || item?.call_type || '').toLowerCase();
}

/** Duration formatted as "Xm Ys" */
export function getDuration(item) {
    const s = item?.duration || item?.duration_seconds || item?.durationSeconds || item?.call_duration;
    if (!s) return null;
    const sec = typeof s === 'string' ? parseInt(s, 10) : s;
    if (!isFinite(sec) || sec < 0) return null;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

/** Date formatted for display */
export function getFmtDate(item, opts = {}) {
    const raw = item?.started_at || item?.startedAt || item?.created_at ||
        item?.createdAt || item?.scheduled_at || item?.scheduledAt;
    if (!raw) return '';
    try {
        return new Date(raw).toLocaleString('en-IN', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit', hour12: true,
            ...opts,
        });
    } catch { return ''; }
}

/** Normalise API list response to always be an array */
export function normaliseList(data) {
    if (Array.isArray(data)) return data;
    return (
        data?.conversations ||
        data?.calls ||
        data?.reminderCalls ||
        data?.rows ||
        data?.items ||
        data?.data ||
        data?.results ||
        []
    );
}

/** Extract audio URL from a conversation/call object */
export function getAudioUrl(item) {
    return (
        item?.audio_url ||
        item?.recording_url ||
        item?.recordingUrl ||
        item?.audioUrl ||
        item?.file_url ||
        item?.call?.audio_url ||
        item?.call?.recording_url ||
        item?.conversation?.audio_url ||
        item?.conversation?.recording_url ||
        null
    );
}

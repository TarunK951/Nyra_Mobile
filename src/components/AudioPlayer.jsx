/**
 * AudioPlayer — streams audio directly from URL using expo-av.
 * No local caching. Seek via touch on waveform bars.
 *
 * Props:
 *   uri?            — direct audio URL to stream
 *   conversationId? — fetch URL from backend if uri not given
 *   colors          — ThemeColors
 *   title?          — label above player
 *   showTitle?      — default true
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ActivityIndicator, PanResponder, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react-native';
import { callApi } from '../api/calls';
import { storage } from '../api/storage';

const SPEEDS = [1.0, 1.5, 2.0];

function fmt(secs) {
    if (!isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

const AudioPlayer = ({ uri, conversationId, colors, title, showTitle = true }) => {
    const soundRef = useRef(null);
    const mounted = useRef(true);
    const seekBarW = useRef(200);

    const [audioUrl, setAudioUrl] = useState(uri || null);
    const [state, setState] = useState('idle'); // idle|loading|ready|error
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [pos, setPos] = useState(0);  // secs
    const [dur, setDur] = useState(0);  // secs
    const [speedIdx, setSpeedIdx] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const [seekPct, setSeekPct] = useState(0);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            // Cleanup any playing sound
            soundRef.current?.stopAsync().catch(() => { });
            soundRef.current?.unloadAsync().catch(() => { });
            soundRef.current = null;
        };
    }, []);

    // ── Step 1: resolve URL ───────────────────────────────────────────────────
    useEffect(() => {
        if (uri) { setAudioUrl(uri); return; }
        if (!conversationId) { setState('error'); return; }

        let cancelled = false;
        setState('loading');
        (async () => {
            try {
                const res = await callApi.getAudio(conversationId);
                // Attempt many possible field names
                const url =
                    res.data?.audio_url ||
                    res.data?.recording_url ||
                    res.data?.recordingUrl ||
                    res.data?.url ||
                    res.data?.audioUrl ||
                    res.data?.file_url ||
                    res.data?.data?.audio_url ||
                    res.data?.data?.url;
                if (cancelled) return;
                if (url) {
                    console.log('[AudioPlayer] resolved URL:', url.slice(0, 80));
                    setAudioUrl(url);
                } else {
                    console.warn('[AudioPlayer] no audio URL in response:', JSON.stringify(res.data).slice(0, 200));
                    setState('error');
                }
            } catch (e) {
                console.warn('[AudioPlayer] getAudio failed:', e?.response?.status, e?.message);
                if (!cancelled) setState('error');
            }
        })();
        return () => { cancelled = true; };
    }, [uri, conversationId]);

    // ── Step 2: load & stream ─────────────────────────────────────────────────
    useEffect(() => {
        if (!audioUrl) return;

        let snd = null;
        setState('loading');
        setPos(0); setDur(0); setIsPlaying(false);

        (async () => {
            try {
                // Request audio permissions on Android (required for expo-av)
                if (Platform.OS === 'android') {
                    const { status } = await Audio.requestPermissionsAsync();
                    if (status !== 'granted') {
                        console.warn('[AudioPlayer] audio permission denied');
                        if (mounted.current) setState('error');
                        return;
                    }
                }

                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });

                const token = await storage.getItem('accessToken');
                const source = {
                    uri: audioUrl,
                    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
                };

                console.log('[AudioPlayer] createAsync start:', audioUrl.slice(0, 80));

                const { sound: s, status: initSt } = await Audio.Sound.createAsync(
                    source,
                    {
                        shouldPlay: false,
                        isMuted: false,
                        volume: 1.0,
                        progressUpdateIntervalMillis: 250,
                    },
                    (st) => {
                        if (!mounted.current) return;
                        if (!st.isLoaded) {
                            if (st.error) {
                                console.warn('[AudioPlayer] status error:', st.error);
                                setState('error');
                            }
                            return;
                        }
                        setIsPlaying(st.isPlaying);
                        if (!seeking) setPos((st.positionMillis || 0) / 1000);
                        if (st.durationMillis) setDur(st.durationMillis / 1000);
                        if (st.didJustFinish) {
                            setIsPlaying(false);
                            setPos(0);
                            s?.setPositionAsync(0).catch(() => { });
                        }
                    }
                );

                if (!mounted.current) { s.unloadAsync(); return; }

                if (!initSt.isLoaded) {
                    console.warn('[AudioPlayer] not loaded after createAsync, status:', JSON.stringify(initSt));
                    setState('error');
                    return;
                }

                snd = s;
                soundRef.current = s;
                if (initSt.durationMillis) setDur(initSt.durationMillis / 1000);
                setState('ready');
                console.log('[AudioPlayer] ✓ ready dur=', initSt.durationMillis, 'ms');

            } catch (e) {
                console.warn('[AudioPlayer] createAsync error:', e?.message || e);
                if (mounted.current) setState('error');
            }
        })();

        return () => {
            snd?.stopAsync().catch(() => { });
            snd?.unloadAsync().catch(() => { });
            soundRef.current = null;
        };
    }, [audioUrl]);

    // ── Controls ──────────────────────────────────────────────────────────────
    const togglePlay = useCallback(async () => {
        const s = soundRef.current;
        if (!s || state !== 'ready') return;
        try {
            if (isPlaying) await s.pauseAsync();
            else await s.playAsync();
        } catch (e) { console.warn('[AudioPlayer] togglePlay:', e?.message); }
    }, [isPlaying, state]);

    const toggleMute = useCallback(async () => {
        const s = soundRef.current;
        if (!s) return;
        await s.setIsMutedAsync(!isMuted).catch(() => { });
        setIsMuted(m => !m);
    }, [isMuted]);

    const cycleSpeed = useCallback(async () => {
        const s = soundRef.current;
        if (!s) return;
        const next = (speedIdx + 1) % SPEEDS.length;
        setSpeedIdx(next);
        await s.setRateAsync(SPEEDS[next], true).catch(() => { });
    }, [speedIdx]);

    const seekTo = useCallback(async (pct) => {
        const s = soundRef.current;
        if (!s || dur <= 0) return;
        const ms = Math.round(Math.max(0, Math.min(1, pct)) * dur * 1000);
        setPos(pct * dur);
        await s.setPositionAsync(ms).catch(() => { });
    }, [dur]);

    // ── Seek via PanResponder (no external Slider pkg) ─────────────────────
    const pan = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
            setSeeking(true);
            setSeekPct(Math.max(0, Math.min(1, e.nativeEvent.locationX / seekBarW.current)));
        },
        onPanResponderMove: (e) => {
            setSeekPct(Math.max(0, Math.min(1, e.nativeEvent.locationX / seekBarW.current)));
        },
        onPanResponderRelease: (e) => {
            const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / seekBarW.current));
            setSeeking(false);
            seekTo(pct);
        },
    })).current;

    // ── Derived ───────────────────────────────────────────────────────────────
    const pct = seeking ? seekPct : (dur > 0 ? pos / dur : 0);
    const isLoading = state === 'idle' || state === 'loading';

    if (state === 'error') {
        return (
            <View style={[styles.errBox, { backgroundColor: colors.muted || '#f3f4f6', borderColor: colors.cardBorder || '#e5e7eb' }]}>
                <Text style={[styles.errTxt, { color: colors.mutedForeground || '#6b7280' }]}>🎙️ Recording unavailable</Text>
            </View>
        );
    }

    return (
        <View style={[styles.wrap, { backgroundColor: colors.accentSoft || '#f0fdf4', borderColor: colors.cardBorder || '#d1fae5' }]}>
            {showTitle && !!title && (
                <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>🎙️ {title}</Text>
            )}

            {/* ── Waveform / seek ── */}
            <View
                style={styles.wave}
                onLayout={e => { seekBarW.current = e.nativeEvent.layout.width; }}
                {...(state === 'ready' ? pan.panHandlers : {})}
            >
                {Array.from({ length: 40 }).map((_, i) => {
                    const h = 5 + Math.abs(Math.sin(i * 0.8 + 0.5)) * 24;
                    return (
                        <View key={i} style={[styles.bar, {
                            height: h,
                            backgroundColor: (i / 40 <= pct) ? colors.primary : (colors.cardBorder || '#e5e7eb'),
                            opacity: isLoading ? 0.3 : 1,
                        }]} />
                    );
                })}
            </View>

            {/* ── Time ── */}
            <View style={styles.timeRow}>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>{fmt(seeking ? seekPct * dur : pos)}</Text>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>{fmt(dur)}</Text>
            </View>

            {/* ── Controls ── */}
            <View style={styles.ctrl}>
                <TouchableOpacity style={styles.side} onPress={toggleMute} disabled={isLoading}>
                    {isMuted
                        ? <VolumeX size={20} color={colors.mutedForeground} />
                        : <Volume2 size={20} color={colors.primary} />
                    }
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
                    onPress={togglePlay}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : isPlaying
                            ? <Pause size={22} color="#fff" />
                            : <Play size={22} color="#fff" />
                    }
                </TouchableOpacity>

                <TouchableOpacity style={styles.side} onPress={cycleSpeed} disabled={isLoading}>
                    <Text style={[styles.speed, { color: colors.mutedForeground, opacity: isLoading ? 0.4 : 1 }]}>
                        {SPEEDS[speedIdx]}×
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const S = StyleSheet.create;
const styles = S({
    wrap: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
    title: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    wave: { flexDirection: 'row', alignItems: 'center', height: 48, gap: 2, marginBottom: 4 },
    bar: { flex: 1, borderRadius: 2, minWidth: 2 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    time: { fontSize: 12 },
    ctrl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    side: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    playBtn: {
        width: 54, height: 54, borderRadius: 27,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({
            ios: {
                boxShadow: [{
                    offsetX: 0,
                    offsetY: 3,
                    blur: 6,
                    color: 'rgba(0,0,0,0.18)',
                }],
            },
            android: { elevation: 5 },
        }),
    },
    speed: { fontSize: 14, fontWeight: '700' },
    errBox: { borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center', marginBottom: 12 },
    errTxt: { fontSize: 14 },
});

export default AudioPlayer;

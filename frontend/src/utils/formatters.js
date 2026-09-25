/**
 * Utility Formatters for Dates, Hazard Statuses, and Badges
 */

export function formatDate(dateStr) {
    if (!dateStr) return 'Just now';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

export function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Just now';
    try {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
        return 'Recently';
    }
}

export function getSeverityStyle(severity) {
    switch (severity?.toUpperCase()) {
        case 'CRITICAL':
            return {
                bg: '#FEE2E2',
                text: '#DC2626',
                border: '#F87171',
                label: 'CRITICAL'
            };
        case 'HIGH':
            return {
                bg: '#FFEDD5',
                text: '#EA580C',
                border: '#FB923C',
                label: 'HIGH RISK'
            };
        case 'MEDIUM':
            return {
                bg: '#FEF3C7',
                text: '#D97706',
                border: '#FCD34D',
                label: 'MODERATE'
            };
        case 'LOW':
        default:
            return {
                bg: '#E0F2FE',
                text: '#0284C7',
                border: '#7DD3FC',
                label: 'ADVISORY'
            };
    }
}

export function getStatusStyle(status) {
    switch (status?.toUpperCase()) {
        case 'ACTIONED':
        case 'RESOLVED':
            return {
                bg: '#DCFCE7',
                text: '#16A34A',
                border: '#86EFAC',
                label: 'ACTION DISPATCHED'
            };
        case 'ADMIN_VERIFIED':
            return {
                bg: '#DBEAFE',
                text: '#2563EB',
                border: '#93C5FD',
                label: 'OFFICIALLY VERIFIED'
            };
        case 'AI_CHECKED':
            return {
                bg: '#F3E8FF',
                text: '#9333EA',
                border: '#D8B4FE',
                label: 'AI SCREENED'
            };
        case 'FALSE_ALARM':
        case 'RUMOR':
            return {
                bg: '#FEE2E2',
                text: '#DC2626',
                border: '#FCA5A5',
                label: 'FLAGGED RUMOR'
            };
        case 'REPORTED':
        default:
            return {
                bg: '#F3F4F6',
                text: '#4B5563',
                border: '#E5E7EB',
                label: 'NEW REPORT'
            };
    }
}

export function getHazardMeta(hazardType) {
    switch (hazardType?.toUpperCase()) {
        case 'FLASH_FLOOD':
            return { label: 'Flash Flood', icon: '🌊', color: '#0866FF' };
        case 'WATERLOGGING':
            return { label: 'Waterlogging', icon: '🌧️', color: '#0284C7' };
        case 'CYCLONE_WIND':
            return { label: 'Severe Squall', icon: '🌪️', color: '#7C3AED' };
        case 'HEATWAVE':
            return { label: 'Heatwave', icon: '☀️', color: '#EA580C' };
        default:
            return { label: hazardType || 'Incident', icon: '⚠️', color: '#64748B' };
    }
}

export function getBadgeDetails(tier) {
    switch (tier?.toUpperCase()) {
        case 'CRISIS_GUARDIAN':
            return { name: 'Crisis Guardian', icon: '🛡️', color: '#D97706', minScore: 90 };
        case 'DISASTER_SENTINEL':
            return { name: 'Disaster Sentinel', icon: '🎖️', color: '#2563EB', minScore: 75 };
        case 'ACTIVE_SCOUT':
            return { name: 'Active Scout', icon: '🧭', color: '#16A34A', minScore: 50 };
        case 'NOVICE_SCOUT':
        default:
            return { name: 'Novice Scout', icon: '🌱', color: '#64748B', minScore: 0 };
    }
}

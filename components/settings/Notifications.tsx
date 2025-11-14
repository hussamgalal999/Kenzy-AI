import React from 'react';
import ViewWrapper from '../ViewWrapper';
import { useI18n } from '../../i18n';

interface NotificationsProps {
  onBack: () => void;
}

const Toggle: React.FC<{ label: string; enabled: boolean; onToggle: () => void; }> = ({ label, enabled, onToggle }) => (
    <div className="flex justify-between items-center p-4 bg-white dark:bg-brand-blue/20 rounded-lg">
        <span className="font-medium">{label}</span>
        <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-brand-blue/40'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`} />
        </button>
    </div>
);


const Notifications: React.FC<NotificationsProps> = ({ onBack }) => {
    const { t } = useI18n();
    const [notifications, setNotifications] = React.useState({
        push: true,
        email: true,
        progress: true,
        content: false,
    });

    const handleToggle = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <ViewWrapper title={t('notificationSettings')} onBack={onBack}>
            <div className="space-y-4">
               <Toggle label={t('pushNotifications')} enabled={notifications.push} onToggle={() => handleToggle('push')} />
               <Toggle label={t('emailNotifications')} enabled={notifications.email} onToggle={() => handleToggle('email')} />
               <Toggle label={t('weeklyProgressReports')} enabled={notifications.progress} onToggle={() => handleToggle('progress')} />
               <Toggle label={t('newContentAlerts')} enabled={notifications.content} onToggle={() => handleToggle('content')} />
            </div>
        </ViewWrapper>
    );
};

export default Notifications;

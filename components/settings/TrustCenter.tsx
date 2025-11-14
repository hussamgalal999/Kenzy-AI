import React from 'react';
import ViewWrapper from '../ViewWrapper';
import { useI18n } from '../../i18n';

interface TrustCenterProps {
  onBack: () => void;
}

const VerifiedBadge: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="flex items-center gap-1 bg-green-500/20 text-green-600 dark:text-green-300 rounded-full px-2 py-0.5 text-xs font-semibold">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span>{t('verified')}</span>
        </div>
    );
};

interface TrustMemberCardProps {
    name: string;
    title: string;
    certifications: string[];
    issuers: string[];
}

const TrustMemberCard: React.FC<TrustMemberCardProps> = ({ name, title, certifications, issuers }) => {
    return (
        <div className="bg-white dark:bg-brand-blue/20 p-4 rounded-xl shadow-sm w-full">
            <div className="flex flex-row-reverse rtl:flex-row justify-between items-start gap-4">
                <div className="text-right rtl:text-left flex-1">
                    <h3 className="text-lg font-bold text-brand-blue dark:text-white">{name}</h3>
                    <p className="text-sm font-medium text-primary">{title}</p>
                </div>
                <VerifiedBadge />
            </div>
            <div className="mt-3 pt-3 border-t border-light-gray dark:border-brand-blue/30 text-center text-brand-purple dark:text-white/70 text-sm space-y-1">
                {certifications.filter(c => c).map((cert, index) => <p key={index}>{cert}</p>)}
                {issuers.filter(i => i).map((issuer, index) => <p key={index} className="text-xs opacity-80">{issuer}</p>)}
            </div>
        </div>
    );
};

const TrustCenter: React.FC<TrustCenterProps> = ({ onBack }) => {
    const { t } = useI18n();

    const teamMembers = [
        { name: t('hossamGalal'), title: t('coFounder'), certifications: [t('qudsystemLeader'), t('softwareEngineer'), t('entrepreneur')], issuers: [] },
        { name: t('allyahKhan'), title: t('chiefSecurityOfficer'), certifications: [t('qudsystemMember'), t('allyahKhanCert')], issuers: [t('allyahKhanIssuer')] },
        { name: t('benCarter'), title: t('leadComplianceAnalyst'), certifications: [t('qudsystemMember'), t('benCarterCert')], issuers: [t('benCarterIssuer')] },
        { name: t('yusufAhmed'), title: t('seniorBackendEngineer'), certifications: [t('qudsystemMember'), t('yusufAhmedCert')], issuers: [t('yusufAhmedIssuer')] },
        { name: t('fatimaElAmin'), title: t('legalCounselEMEA'), certifications: [t('qudsystemMember'), t('fatimaElAminCert')], issuers: [t('fatimaElAminIssuer')] },
    ];

    const projects = [
        "CVPEN",
        "DMA",
        "Kenzy AI Storybook",
        "myHowia",
        "ProtectX",
        "Qud Design",
        "Qud Project",
        "QudSchool",
        "Qud System",
        "Qudemy",
        "QudMind",
        "QudSoft",
        "Qudsystem",
        "Vision Guard System",
        "VoltMotors",
        "More Soon"
    ];


    return (
        <ViewWrapper title={t('trustCenter')} onBack={onBack} description={t('trustCenterDesc')}>
             <div className="space-y-8">
                <div className="space-y-4">
                    {teamMembers.map(member => (
                        <TrustMemberCard
                            key={member.name}
                            name={member.name}
                            title={member.title}
                            certifications={member.certifications}
                            issuers={member.issuers}
                        />
                    ))}
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-brand-blue dark:text-white mb-4">{t('ourProjects')}</h2>
                    <div className="flex flex-wrap gap-3">
                        {projects.map((project, index) => (
                            <span key={index} className="bg-light-gray dark:bg-brand-blue/30 text-brand-blue dark:text-white/90 font-semibold px-4 py-2 rounded-lg text-sm shadow-sm">
                                {project === 'More Soon' ? t('moreSoon') : project}
                            </span>
                        ))}
                    </div>
                </div>
             </div>
        </ViewWrapper>
    );
};

export default TrustCenter;
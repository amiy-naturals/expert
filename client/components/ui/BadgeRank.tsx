import React from 'react';

export default function BadgeRank({ variant = 'doctor', size = 'md', showTooltip = true }: { variant?: 'doctor' | 'senior_expert' | 'gold_mentor' | 'platinum_leader'; size?: 'sm' | 'md' | 'lg'; showTooltip?: boolean }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-sm';
  let classes = 'inline-flex items-center gap-2 rounded-full font-semibold ' + sizeClasses;
  let label = 'Doctor';
  let tooltip = '';
  switch (variant) {
    case 'senior_expert':
      classes += ' bg-gradient-to-r from-gray-200 to-gray-400 text-gray-800 shadow-sm';
      label = 'Senior Expert';
      tooltip = '≥ 50 patients & 20 doctor referrals';
      break;
    case 'gold_mentor':
      classes += ' bg-gradient-to-r from-yellow-300 to-yellow-500 text-white shadow-md ring-1 ring-yellow-200';
      label = 'Gold Mentor';
      tooltip = '≥ 5 active doctors & ₹1,00,000 sales';
      break;
    case 'platinum_leader':
      classes += ' bg-gradient-to-r from-slate-200 to-indigo-200 text-gray-900 shadow-lg ring-1 ring-indigo-100 animate-pulse';
      label = 'Platinum Leader';
      tooltip = '≥ 50 active doctors & ₹5,00,000 sales';
      break;
    default:
      classes += ' bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border';
      label = 'Amiy Doctor';
      tooltip = 'Onboarding completed.';
  }

  return (
    <span className={classes} title={showTooltip ? tooltip : undefined}>
      <span className="truncate">{label}</span>
    </span>
  );
}

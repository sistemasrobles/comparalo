import { getSafetyScoreColor, getSafetyScoreBg, getSafetyLabel } from '@/lib/utils';

interface SafetyScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SafetyScore({ score, size = 'md', showLabel = true }: SafetyScoreProps) {
  const color = getSafetyScoreColor(score);
  const bg = getSafetyScoreBg(score);
  const label = getSafetyLabel(score);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Puntaje de seguridad</span>
          <span className={`text-sm font-semibold ${color}`}>
            {score}/100 - {label}
          </span>
        </div>
      )}
      <div className={`w-full ${bg} rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 80 ? 'bg-green-500' :
            score >= 60 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

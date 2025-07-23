import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface VestingDurationSelectorProps {
  selectedDuration: number | null;
  customDate: Date | null;
  onDurationChange: (duration: number | null) => void;
  onCustomDateChange: (date: Date | null) => void;
}

const VestingDurationSelector: React.FC<VestingDurationSelectorProps> = ({
  selectedDuration,
  customDate,
  onDurationChange,
  onCustomDateChange
}) => {
  const presetDurations = [
    { days: 7, label: '7 jours', description: 'Verrouillage court terme' },
    { days: 30, label: '30 jours', description: 'Verrouillage mensuel' },
    { days: 90, label: '90 jours', description: 'Verrouillage trimestriel' },
    { days: 365, label: '1 an', description: 'Verrouillage long terme' }
  ];

  const handlePresetSelect = (days: number) => {
    onDurationChange(days);
    onCustomDateChange(null);
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const now = new Date();

    if (date > now) {
      onCustomDateChange(date);
      onDurationChange(null);
    }
  };

  const getUnlockDate = () => {
    if (customDate) return customDate;
    if (selectedDuration) {
      const date = new Date();
      date.setDate(date.getDate() + selectedDuration);
      return date;
    }
    return null;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().slice(0, 16);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2'>
          <Clock className='w-5 h-5' />
          <span>Durée de verrouillage</span>
        </h3>

        {/* Durées prédéfinies */}
        <div className='grid grid-cols-2 gap-3 mb-6'>
          {presetDurations.map((duration) => (
            <button
              key={duration.days}
              onClick={() => handlePresetSelect(duration.days)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${
                  selectedDuration === duration.days
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}
            >
              <div className='font-semibold'>{duration.label}</div>
              <div className='text-sm opacity-75'>{duration.description}</div>
            </button>
          ))}
        </div>

        {/* Date personnalisée */}
        <div className='border-t pt-4'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Ou choisir une date personnalisée :
          </label>
          <input
            type='datetime-local'
            min={minDateString}
            onChange={handleCustomDateChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>
      </div>

      {/* Aperçu de la date de déverrouillage */}
      {getUnlockDate() && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2 text-green-700'>
            <Calendar className='w-5 h-5' />
            <span className='font-semibold'>Date de déverrouillage :</span>
          </div>
          <p className='text-green-800 mt-1 font-medium'>
            {formatDate(getUnlockDate()!)}
          </p>
        </div>
      )}
    </div>
  );
};

export default VestingDurationSelector;

import type { DonationCampaign, CampaignProgress } from '../../types/donation';

interface DonationProgressProps {
  campaign: DonationCampaign;
  progress: CampaignProgress;
  showDetails?: boolean;
  compact?: boolean;
}

export default function DonationProgress({
  campaign,
  progress,
  showDetails = true,
  compact = false,
}: DonationProgressProps) {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">
            {campaign.title}
          </h4>
          <span className="text-sm text-gray-500">
            {progress.percentageComplete.toFixed(0)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress.percentageComplete, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>
            {formatCurrency(campaign.currentAmount, campaign.currency)} raised
          </span>
          <span>
            of {formatCurrency(campaign.goalAmount, campaign.currency)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {campaign.title}
        </h3>
        {campaign.description && (
          <p className="text-gray-600 text-sm leading-relaxed">
            {campaign.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-blue-600">
            {progress.percentageComplete.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress.percentageComplete, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {formatCurrency(campaign.currentAmount, campaign.currency)} raised
          </span>
          <span>
            of {formatCurrency(campaign.goalAmount, campaign.currency)} goal
          </span>
        </div>
      </div>

      {/* Statistics */}
      {showDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(campaign.goalAmount - progress.totalRaised, campaign.currency)}
            </div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {progress.donorCount}
            </div>
            <div className="text-sm text-gray-600">
              {progress.donorCount === 1 ? 'Donor' : 'Donors'}
            </div>
          </div>

          {progress.daysRemaining !== undefined && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {progress.daysRemaining > 0 ? progress.daysRemaining : 0}
              </div>
              <div className="text-sm text-gray-600">
                {progress.daysRemaining === 1 ? 'Day Left' : 'Days Left'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign Dates */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Started:</span>{' '}
              {formatDate(campaign.startDate)}
            </div>
            {campaign.endDate && (
              <div>
                <span className="font-medium">Ends:</span>{' '}
                {formatDate(campaign.endDate)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {progress.percentageComplete >= 100 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Goal Achieved!
              </h4>
              <p className="text-sm text-green-700">
                Thank you to all our donors for helping us reach our fundraising
                goal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Urgency Message */}
      {progress.daysRemaining !== undefined &&
        progress.daysRemaining <= 7 &&
        progress.daysRemaining > 0 &&
        progress.percentageComplete < 100 && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-orange-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-orange-800">
                  Time Running Out!
                </h4>
                <p className="text-sm text-orange-700">
                  Only {progress.daysRemaining}{' '}
                  {progress.daysRemaining === 1 ? 'day' : 'days'} left to reach
                  our goal.
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

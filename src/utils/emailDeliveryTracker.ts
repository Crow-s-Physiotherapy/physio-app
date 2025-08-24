/**
 * Email delivery status tracking for donation notifications
 * Requirements: 5.3
 */

export interface EmailDeliveryAttempt {
  id: string;
  donationId: string;
  recipientEmail: string;
  emailType: 'donation_confirmation';
  status: 'pending' | 'sent' | 'failed' | 'retry';
  attemptCount: number;
  lastAttempt: Date;
  error?: string;
  emailServiceResponse?: any;
}

export interface EmailDeliveryStats {
  totalAttempts: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
}

class EmailDeliveryTracker {
  private static instance: EmailDeliveryTracker;
  private deliveryAttempts: Map<string, EmailDeliveryAttempt> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds

  private constructor() {
    // Load from localStorage if available
    this.loadFromStorage();
  }

  public static getInstance(): EmailDeliveryTracker {
    if (!EmailDeliveryTracker.instance) {
      EmailDeliveryTracker.instance = new EmailDeliveryTracker();
    }
    return EmailDeliveryTracker.instance;
  }

  /**
   * Track a new email delivery attempt
   */
  trackDeliveryAttempt(
    donationId: string,
    recipientEmail: string,
    emailType: 'donation_confirmation' = 'donation_confirmation'
  ): string {
    const attemptId = `${donationId}_${emailType}_${Date.now()}`;

    const attempt: EmailDeliveryAttempt = {
      id: attemptId,
      donationId,
      recipientEmail,
      emailType,
      status: 'pending',
      attemptCount: 1,
      lastAttempt: new Date(),
    };

    this.deliveryAttempts.set(attemptId, attempt);
    this.saveToStorage();

    return attemptId;
  }

  /**
   * Update delivery status
   */
  updateDeliveryStatus(
    attemptId: string,
    status: 'sent' | 'failed',
    error?: string,
    emailServiceResponse?: any
  ): void {
    const attempt = this.deliveryAttempts.get(attemptId);
    if (!attempt) return;

    attempt.status = status;
    attempt.lastAttempt = new Date();

    if (error) {
      attempt.error = error;
    }

    if (emailServiceResponse) {
      attempt.emailServiceResponse = emailServiceResponse;
    }

    this.deliveryAttempts.set(attemptId, attempt);
    this.saveToStorage();

    // Schedule retry if failed and under retry limit
    if (status === 'failed' && attempt.attemptCount < this.MAX_RETRY_ATTEMPTS) {
      this.scheduleRetry(attemptId);
    }
  }

  /**
   * Schedule retry for failed delivery
   */
  private scheduleRetry(attemptId: string): void {
    const attempt = this.deliveryAttempts.get(attemptId);
    if (!attempt) return;

    setTimeout(() => {
      const currentAttempt = this.deliveryAttempts.get(attemptId);
      if (!currentAttempt || currentAttempt.status === 'sent') return;

      currentAttempt.status = 'retry';
      currentAttempt.attemptCount += 1;
      currentAttempt.lastAttempt = new Date();

      this.deliveryAttempts.set(attemptId, currentAttempt);
      this.saveToStorage();

      // Trigger retry callback if available
      this.onRetryCallback?.(currentAttempt);
    }, this.RETRY_DELAY_MS * attempt.attemptCount); // Exponential backoff
  }

  /**
   * Get delivery status for a donation
   */
  getDeliveryStatus(donationId: string): EmailDeliveryAttempt[] {
    return Array.from(this.deliveryAttempts.values())
      .filter(attempt => attempt.donationId === donationId)
      .sort((a, b) => b.lastAttempt.getTime() - a.lastAttempt.getTime());
  }

  /**
   * Get overall delivery statistics
   */
  getDeliveryStats(): EmailDeliveryStats {
    const attempts = Array.from(this.deliveryAttempts.values());
    const totalAttempts = attempts.length;
    const successful = attempts.filter(a => a.status === 'sent').length;
    const failed = attempts.filter(
      a => a.status === 'failed' && a.attemptCount >= this.MAX_RETRY_ATTEMPTS
    ).length;
    const pending = attempts.filter(
      a => a.status === 'pending' || a.status === 'retry'
    ).length;

    return {
      totalAttempts,
      successful,
      failed,
      pending,
      successRate: totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0,
    };
  }

  /**
   * Get failed deliveries that need attention
   */
  getFailedDeliveries(): EmailDeliveryAttempt[] {
    return Array.from(this.deliveryAttempts.values())
      .filter(
        attempt =>
          attempt.status === 'failed' &&
          attempt.attemptCount >= this.MAX_RETRY_ATTEMPTS
      )
      .sort((a, b) => b.lastAttempt.getTime() - a.lastAttempt.getTime());
  }

  /**
   * Clear old delivery attempts (older than 30 days)
   */
  cleanupOldAttempts(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const [id, attempt] of this.deliveryAttempts.entries()) {
      if (attempt.lastAttempt < thirtyDaysAgo) {
        this.deliveryAttempts.delete(id);
      }
    }

    this.saveToStorage();
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.deliveryAttempts.entries()).map(
        ([attemptId, attempt]) => ({
          ...attempt,
          id: attemptId,
          lastAttempt: attempt.lastAttempt.toISOString(),
        })
      );

      localStorage.setItem('emailDeliveryAttempts', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save email delivery attempts to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('emailDeliveryAttempts');
      if (!data) return;

      const attempts = JSON.parse(data);
      for (const attemptData of attempts) {
        const attempt: EmailDeliveryAttempt = {
          ...attemptData,
          lastAttempt: new Date(attemptData.lastAttempt),
        };
        this.deliveryAttempts.set(attempt.id, attempt);
      }
    } catch (error) {
      console.warn(
        'Failed to load email delivery attempts from storage:',
        error
      );
    }
  }

  /**
   * Set retry callback for handling retry attempts
   */
  private onRetryCallback?: (attempt: EmailDeliveryAttempt) => void;

  setRetryCallback(callback: (attempt: EmailDeliveryAttempt) => void): void {
    this.onRetryCallback = callback;
  }

  /**
   * Manual retry for failed delivery
   */
  async manualRetry(attemptId: string): Promise<boolean> {
    const attempt = this.deliveryAttempts.get(attemptId);
    if (!attempt || attempt.status === 'sent') return false;

    attempt.status = 'retry';
    attempt.attemptCount += 1;
    attempt.lastAttempt = new Date();

    this.deliveryAttempts.set(attemptId, attempt);
    this.saveToStorage();

    return true;
  }

  /**
   * Get delivery summary for a specific email
   */
  getEmailDeliverySummary(recipientEmail: string): {
    totalAttempts: number;
    lastAttempt?: Date;
    lastStatus?: string;
    successfulDeliveries: number;
  } {
    const attempts = Array.from(this.deliveryAttempts.values()).filter(
      attempt => attempt.recipientEmail === recipientEmail
    );

    const totalAttempts = attempts.length;
    const successfulDeliveries = attempts.filter(
      a => a.status === 'sent'
    ).length;
    const lastAttempt =
      attempts.length > 0
        ? attempts.reduce((latest, current) =>
            current.lastAttempt > latest.lastAttempt ? current : latest
          )
        : null;

    const result: {
      totalAttempts: number;
      lastAttempt?: Date;
      lastStatus?: string;
      successfulDeliveries: number;
    } = {
      totalAttempts,
      successfulDeliveries,
    };

    if (lastAttempt?.lastAttempt) {
      result.lastAttempt = lastAttempt.lastAttempt;
    }
    if (lastAttempt?.status) {
      result.lastStatus = lastAttempt.status;
    }

    return result;
  }
}

export const emailDeliveryTracker = EmailDeliveryTracker.getInstance();
export default emailDeliveryTracker;

/**
 * Mobile Responsiveness and Accessibility Validation Utilities
 */

// Validate touch target sizes
export const validateTouchTargets = (): {
  passed: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
  );

  interactiveElements.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // WCAG AA minimum touch target size

    if (rect.width < minSize || rect.height < minSize) {
      const tagName = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : '';
      const className = element.className
        ? `.${element.className.split(' ')[0]}`
        : '';
      const identifier = `${tagName}${id}${className} (${index + 1})`;

      issues.push(
        `Touch target too small: ${identifier} - ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum: ${minSize}x${minSize}px)`
      );
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
};

// Validate color contrast (basic implementation)
export const validateColorContrast = (): {
  passed: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  // This is a simplified implementation
  // In a real app, you'd use a proper color contrast library like 'color-contrast'
  const textElements = document.querySelectorAll(
    'p, h1, h2, h3, h4, h5, h6, span, a, button, label'
  );

  textElements.forEach((element, index) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Skip elements with transparent backgrounds
    if (
      backgroundColor === 'rgba(0, 0, 0, 0)' ||
      backgroundColor === 'transparent'
    ) {
      return;
    }

    // Basic check - this would need a proper contrast ratio calculation in production
    if (color === backgroundColor) {
      issues.push(
        `Potential contrast issue: Element ${index + 1} has same text and background color`
      );
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
};

// Validate ARIA labels and roles
export const validateAriaLabels = (): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check for buttons without accessible names
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledBy = button.getAttribute('aria-labelledby');

    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push(
        `Button ${index + 1} lacks accessible name (text content, aria-label, or aria-labelledby)`
      );
    }
  });

  // Check for images without alt text
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    const hasAlt = img.getAttribute('alt') !== null;
    const isDecorative =
      img.getAttribute('role') === 'presentation' ||
      img.getAttribute('aria-hidden') === 'true';

    if (!hasAlt && !isDecorative) {
      issues.push(`Image ${index + 1} lacks alt text or decorative role`);
    }
  });

  // Check for form inputs without labels
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const id = input.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push(`Form input ${index + 1} lacks associated label`);
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
};

// Validate keyboard navigation
export const validateKeyboardNavigation = (): {
  passed: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  // Check for interactive elements with tabindex="-1" that shouldn't have it
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, textarea'
  );
  interactiveElements.forEach((element, index) => {
    const tabIndex = element.getAttribute('tabindex');
    const isDisabled =
      element.hasAttribute('disabled') ||
      element.getAttribute('aria-disabled') === 'true';

    if (tabIndex === '-1' && !isDisabled) {
      issues.push(
        `Interactive element ${index + 1} has tabindex="-1" but is not disabled`
      );
    }
  });

  // Check for skip links
  const skipLinks = document.querySelectorAll('a[href^="#"]');
  const hasSkipToMain = Array.from(skipLinks).some(
    link =>
      link.textContent?.toLowerCase().includes('skip') &&
      link.textContent?.toLowerCase().includes('main')
  );

  if (!hasSkipToMain) {
    issues.push('No "skip to main content" link found');
  }

  return {
    passed: issues.length === 0,
    issues,
  };
};

// Validate responsive design
export const validateResponsiveDesign = (): {
  passed: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  // Check viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    issues.push('Missing viewport meta tag');
  } else {
    const content = viewportMeta.getAttribute('content');
    if (!content?.includes('width=device-width')) {
      issues.push('Viewport meta tag should include width=device-width');
    }
  }

  // Check for horizontal scrolling at mobile widths
  const body = document.body;
  const html = document.documentElement;
  const documentWidth = Math.max(
    body.scrollWidth,
    body.offsetWidth,
    html.clientWidth,
    html.scrollWidth,
    html.offsetWidth
  );

  if (documentWidth > window.innerWidth) {
    issues.push(
      `Horizontal scrolling detected: document width (${documentWidth}px) exceeds viewport width (${window.innerWidth}px)`
    );
  }

  return {
    passed: issues.length === 0,
    issues,
  };
};

// Run all validations
export const runAccessibilityAudit = () => {
  const results = {
    touchTargets: validateTouchTargets(),
    colorContrast: validateColorContrast(),
    ariaLabels: validateAriaLabels(),
    keyboardNavigation: validateKeyboardNavigation(),
    responsiveDesign: validateResponsiveDesign(),
  };

  const allIssues = Object.values(results).flatMap(result => result.issues);
  const overallPassed = Object.values(results).every(result => result.passed);

  return {
    passed: overallPassed,
    results,
    summary: {
      totalIssues: allIssues.length,
      categories: Object.keys(results).length,
      passedCategories: Object.values(results).filter(r => r.passed).length,
    },
  };
};

// Development helper to log audit results
export const logAccessibilityAudit = (): any => {
  if (import.meta.env.DEV) {
    const audit = runAccessibilityAudit();

    console.group('🔍 Accessibility Audit Results');
    console.log(`Overall Status: ${audit.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Issues Found: ${audit.summary.totalIssues}`);
    console.log(
      `Categories Passed: ${audit.summary.passedCategories}/${audit.summary.categories}`
    );

    Object.entries(audit.results).forEach(([category, result]) => {
      console.group(`${result.passed ? '✅' : '❌'} ${category}`);
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.warn(issue));
      } else {
        console.log('No issues found');
      }
      console.groupEnd();
    });

    console.groupEnd();

    return audit;
  }
};

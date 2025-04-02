/* Apply patch to fix text selection in all form fields */
document.addEventListener('DOMContentLoaded', function() {
  // Patch all inputs to be selectable
  const patchSelectable = () => {
    const inputs = document.querySelectorAll('input, textarea, .FormattedNumberInput, [class*="number"]');
    inputs.forEach(input => {
      input.style.userSelect = 'text';
      input.style.cursor = 'text';
      input.setAttribute('data-selectable', 'true');
    });
  };
  
  // Run immediately and also on DOM changes
  patchSelectable();
  const observer = new MutationObserver(patchSelectable);
  observer.observe(document.body, { childList: true, subtree: true });
}); 
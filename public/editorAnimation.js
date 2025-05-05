// This script runs outside React's lifecycle to ensure animations run only once
(function() {
    // Function to show the editor controls
    function showEditorControls() {
      // Wait until DOM is fully loaded
      setTimeout(() => {
        // Get all editor toolbars and word count displays
        const toolbars = document.querySelectorAll('.editor-toolbar');
        const wordCounts = document.querySelectorAll('.word-count-toggle');
        
        // Show toolbars
        toolbars.forEach(toolbar => {
          toolbar.style.opacity = '1';
          toolbar.style.transform = 'translateY(0)';
        });
        
        // Show word counts
        wordCounts.forEach(wordCount => {
          wordCount.style.opacity = '1';
          wordCount.style.transform = 'translateY(0)';
        });
        
        // Store that we've already shown the elements
        sessionStorage.setItem('editorControlsShown', 'true');
      }, 500);
    }
    
    // Check if we've already shown the controls in this session
    const alreadyShown = sessionStorage.getItem('editorControlsShown');
    
    // If controls are not shown yet, show them
    if (!alreadyShown) {
      // Wait for DOM content to be loaded
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        showEditorControls();
      } else {
        document.addEventListener('DOMContentLoaded', showEditorControls);
      }
    }
  })();
import { Model } from "survey-core";
import "survey-core/survey-core.min.css";
import { Tabulator } from "survey-analytics/survey.analytics.tabulator";
import { VisualizationPanel } from "survey-analytics";
import "survey-analytics/survey.analytics.min.css";
import "tabulator-tables/dist/css/tabulator.min.css";
import { loadResponses, saveResponse } from "@shared/utils/supabase";
import {
  STORAGE_KEY,
  LAST_SAVE_KEY,
  FORM_COMPLETED_KEY,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorageKeys
} from "@shared/utils/storage";
import { i18n, type Language } from "./i18n";

// Initialize survey
let currentSurvey: Model | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Update all translations in the DOM
function updateTranslations(): void {
  // Update page title
  document.title = i18n.t('pageTitle');
  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl) pageTitleEl.textContent = i18n.t('pageTitle');

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = i18n.t(key);
    }
  });

  // Update welcome view specific elements
  const welcomeDesc = document.getElementById('welcomeDescription');
  if (welcomeDesc) welcomeDesc.textContent = i18n.t('welcomeDescription');

  const auctionInfo = document.getElementById('auctionInfo');
  if (auctionInfo) auctionInfo.textContent = i18n.t('auctionInfo');

  const currentInvestmentLabel = document.getElementById('currentInvestmentLabel');
  if (currentInvestmentLabel) currentInvestmentLabel.textContent = i18n.t('currentInvestment');

  const moreInfoLabel = document.getElementById('moreInfoLabel');
  if (moreInfoLabel) moreInfoLabel.textContent = i18n.t('moreInfoLabel');

  const moreInfoLink = document.getElementById('moreInfoLink');
  if (moreInfoLink) moreInfoLink.textContent = i18n.t('moreInfoLink');

  const whatsappLabel = document.getElementById('whatsappLabel');
  if (whatsappLabel) whatsappLabel.textContent = i18n.t('whatsappLabel');

  const whatsappLink = document.getElementById('whatsappLink');
  if (whatsappLink) whatsappLink.textContent = i18n.t('whatsappLink');

  const surveyDurationLabel = document.getElementById('surveyDurationLabel');
  if (surveyDurationLabel) surveyDurationLabel.textContent = i18n.t('surveyDuration');

  const surveyDurationValue = document.getElementById('surveyDurationValue');
  if (surveyDurationValue) surveyDurationValue.textContent = i18n.t('surveyDurationValue');

  const autoSaveLabel = document.getElementById('autoSaveLabel');
  if (autoSaveLabel) autoSaveLabel.textContent = i18n.t('autoSaveLabel');

  const autoSaveDescription = document.getElementById('autoSaveDescription');
  if (autoSaveDescription) autoSaveDescription.textContent = i18n.t('autoSaveDescription');

  const startSurveyBtn = document.getElementById('startSurveyBtn');
  if (startSurveyBtn) startSurveyBtn.textContent = i18n.t('startSurveyButton');

  const clearFormBtn = document.getElementById('clearFormBtn');
  if (clearFormBtn) clearFormBtn.innerHTML = i18n.t('clearFormButton');
}

// Initialize language selector
function initLanguageSelector(): void {
  const langButtons = document.querySelectorAll('.lang-btn');
  const currentLang = i18n.getLanguage();

  // Set active state based on current language
  langButtons.forEach(btn => {
    const lang = btn.getAttribute('data-lang') as Language;
    if (lang === currentLang) {
      btn.classList.add('active');
      (btn as HTMLElement).style.background = '#1976d2';
      (btn as HTMLElement).style.color = 'white';
    } else {
      btn.classList.remove('active');
      (btn as HTMLElement).style.background = 'white';
      (btn as HTMLElement).style.color = '#1976d2';
    }
  });

  // Add click handlers
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang') as Language;
      i18n.setLanguage(lang);

      // Update button styles
      langButtons.forEach(b => {
        const bLang = b.getAttribute('data-lang');
        if (bLang === lang) {
          b.classList.add('active');
          (b as HTMLElement).style.background = '#1976d2';
          (b as HTMLElement).style.color = 'white';
        } else {
          b.classList.remove('active');
          (b as HTMLElement).style.background = 'white';
          (b as HTMLElement).style.color = '#1976d2';
        }
      });

      // Update all translations
      updateTranslations();

      // Reinitialize survey with new language config
      if (currentSurvey && document.getElementById('formView')?.classList.contains('active')) {
        initSurvey();
      }

      // Update countdown if on welcome view
      if (document.getElementById('welcomeView')?.classList.contains('active')) {
        updateInvestmentStatus();
      }
    });
  });
}

// Save form data to localStorage with auto-save indicator
function saveFormData(data: any): void {
  try {
    saveToLocalStorage(STORAGE_KEY, data);
    saveToLocalStorage(LAST_SAVE_KEY, new Date().toISOString());
    updateSaveIndicator('saved');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    updateSaveIndicator('error');
  }
}

// Load form data from localStorage
function loadFormData(): any | null {
  return loadFromLocalStorage(STORAGE_KEY);
}

// Clear form data from localStorage
function clearFormData(): void {
  try {
    clearLocalStorageKeys(STORAGE_KEY, LAST_SAVE_KEY, FORM_COMPLETED_KEY);
    updateSaveIndicator('cleared');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// Get last save time
function getLastSaveTime(): string | null {
  return loadFromLocalStorage(LAST_SAVE_KEY);
}

// Mark form as completed
function markFormCompleted(): void {
  saveToLocalStorage(FORM_COMPLETED_KEY, 'true');
}

// Check if form has been completed before
function hasCompletedForm(): boolean {
  return loadFromLocalStorage(FORM_COMPLETED_KEY) === 'true';
}

// Show/hide tabs based on completion status
function updateTabsVisibility(): void {
  const tabs = document.getElementById('mainTabs');
  if (tabs) {
    if (hasCompletedForm()) {
      tabs.style.display = 'flex';
    } else {
      tabs.style.display = 'none';
    }
  }
}

// Update save indicator UI
function updateSaveIndicator(status: 'saving' | 'saved' | 'error' | 'cleared'): void {
  const indicator = document.getElementById('saveIndicator');
  if (!indicator) return;

  switch (status) {
    case 'saving':
      indicator.textContent = i18n.t('saveIndicator.saving');
      indicator.style.color = '#666';
      break;
    case 'saved':
      indicator.textContent = i18n.t('saveIndicator.saved');
      indicator.style.color = '#4caf50';
      setTimeout(() => {
        indicator.textContent = '';
      }, 2000);
      break;
    case 'error':
      indicator.textContent = i18n.t('saveIndicator.error');
      indicator.style.color = '#f44336';
      break;
    case 'cleared':
      indicator.textContent = i18n.t('saveIndicator.cleared');
      indicator.style.color = '#666';
      setTimeout(() => {
        indicator.textContent = '';
      }, 2000);
      break;
  }
}

// Auto-save with debounce
function autoSave(data: any): void {
  updateSaveIndicator('saving');

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveFormData(data);
  }, 500); // Save 500ms after last change
}

// Check if we should skip validation (for development)
function shouldSkipValidation(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('dev') || params.has('skipValidation');
}

// Validation helpers
function validateCurrentPage(survey: Model): any[] {
  const errors: any[] = [];
  const currentPage = survey.currentPage;
  if (currentPage) {
    currentPage.questions.forEach((question: any) => {
      if (question.isRequired && question.isVisible && question.isEmpty()) {
        errors.push({ name: question.name, title: question.title });
      }
    });
  }
  return errors;
}

function highlightErrors(errors: any[]): void {
  // First, clear all previous error highlights
  const allQuestions = document.querySelectorAll('[id^="question-"]');
  allQuestions.forEach((el: any) => {
    el.style.border = '';
    el.style.background = '#f9f9f9';
  });

  // Highlight error fields
  errors.forEach(error => {
    const questionDiv = document.getElementById(`question-${error.name}`);
    if (questionDiv) {
      questionDiv.style.border = '2px solid #f44336';
      questionDiv.style.background = '#ffebee';
      // Scroll to first error
      if (errors[0].name === error.name) {
        questionDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

function initSurvey(): void {
  const surveyElement = document.getElementById("surveyElement");
  if (!surveyElement) return;

  // Clear previous survey
  surveyElement.innerHTML = "";

  // Dispose of old survey instance if it exists
  if (currentSurvey) {
    currentSurvey.clear(false, true);
  }

  // Create survey model with current language config
  const surveyConfig = i18n.getSurveyConfig();
  currentSurvey = new Model(surveyConfig);

  // Load saved data from localStorage
  const savedData = loadFormData();
  if (savedData) {
    currentSurvey.data = savedData;
    console.log("Loaded saved form data from localStorage");

    // Show notification that saved data was loaded
    const lastSave = getLastSaveTime();
    if (lastSave) {
      const lastSaveDate = new Date(lastSave);
      const indicator = document.getElementById('saveIndicator');
      if (indicator) {
        indicator.textContent = `${i18n.t('saveIndicator.loaded')} ${lastSaveDate.toLocaleString()}`;
        indicator.style.color = '#1976d2';
        setTimeout(() => {
          indicator.textContent = '';
        }, 5000);
      }
    }
  }

  // In dev mode, disable validation for easier testing
  if (shouldSkipValidation()) {
    currentSurvey.checkErrorsMode = "onComplete";
    currentSurvey.showNavigationButtons = false; // We render our own buttons
  }

  // Auto-save on value changes
  currentSurvey.onValueChanged.add((sender) => {
    autoSave(sender.data);
  });

  // Add event handler for completion
  currentSurvey.onComplete.add(async (sender) => {
    console.log("Survey completed. Data:", sender.data);

    const success = await saveResponse(sender.data);

    if (success) {
      // Keep the data in localStorage so user can edit and resubmit
      saveFormData(sender.data);

      // Mark form as completed and show tabs
      markFormCompleted();
      updateTabsVisibility();

      setTimeout(() => {
        alert(i18n.t('completionMessage'));

        // Show success message in save indicator
        const indicator = document.getElementById('saveIndicator');
        if (indicator) {
          indicator.textContent = i18n.t('responseSubmitted');
          indicator.style.color = '#4caf50';
        }

        // Switch to analytics tab
        const analyticsTab = document.querySelector('[data-view="analytics"]') as HTMLElement;
        if (analyticsTab) {
          analyticsTab.click();
        }
      }, 100);
    }
  });

  // Render survey directly
  renderSurvey(currentSurvey, surveyElement);

  // Setup clear form button
  setupClearFormButton();
}

// Setup clear form button
function setupClearFormButton(): void {
  const clearBtn = document.getElementById("clearFormBtn");
  if (!clearBtn) return;

  clearBtn.onclick = () => {
    if (confirm(i18n.t('clearFormConfirm'))) {
      clearFormData();

      // Reinitialize the survey to clear all fields
      if (currentSurvey) {
        currentSurvey.clear(true, true);
        currentSurvey.data = {};
      }

      // Hide tabs and show welcome view
      updateTabsVisibility();

      const formView = document.getElementById("formView");
      const welcomeView = document.getElementById("welcomeView");

      if (formView && welcomeView) {
        formView.classList.remove("active");
        welcomeView.classList.add("active");

        // Setup the start survey button again
        setupStartSurveyButton();
      }

      alert(i18n.t('formCleared'));
    }
  };
}

// Simple survey renderer
function renderSurvey(survey: Model, container: HTMLElement): void {
  const renderPage = () => {
    container.innerHTML = "";

    const currentPage = survey.currentPage;
    if (!currentPage) return;

    // Create form
    const form = document.createElement("form");
    form.style.cssText = "max-width: 800px; margin: 0 auto;";

    // Render page title
    if (currentPage.title) {
      const pageTitle = document.createElement("h2");
      pageTitle.textContent = currentPage.title;
      pageTitle.style.cssText = "margin-bottom: 20px; color: #333;";
      form.appendChild(pageTitle);
    }

    // Render questions
    currentPage.questions.forEach((question) => {
      const questionDiv = document.createElement("div");
      questionDiv.id = `question-${question.name}`;
      questionDiv.style.cssText = `margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; ${!question.isVisible ? 'display: none;' : ''}`;

      // Question title
      const title = document.createElement("label");
      title.innerHTML = question.title + (question.isRequired ? ' <span style="color: red;">*</span>' : '');
      title.style.cssText = "display: block; font-weight: 600; margin-bottom: 10px; font-size: 16px;";
      questionDiv.appendChild(title);

      // Question description
      if (question.description) {
        const desc = document.createElement("p");
        desc.textContent = question.description;
        desc.style.cssText = "color: #666; font-size: 14px; margin-bottom: 10px;";
        questionDiv.appendChild(desc);
      }

      // Render input based on type
      const input = createInput(question, survey);
      if (input) {
        questionDiv.appendChild(input);
      }

      form.appendChild(questionDiv);
    });

    // Navigation buttons
    const navDiv = document.createElement("div");
    navDiv.style.cssText = "display: flex; justify-content: space-between; margin-top: 30px;";

    if (!survey.isFirstPage) {
      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.textContent = i18n.t('navigationButtons.previous');
      prevBtn.style.cssText = "padding: 12px 24px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;";
      prevBtn.onclick = () => {
        survey.prevPage();
        renderPage();
      };
      navDiv.appendChild(prevBtn);
    } else {
      navDiv.appendChild(document.createElement("div"));
    }

    if (!survey.isLastPage) {
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.textContent = i18n.t('navigationButtons.next');
      nextBtn.style.cssText = "padding: 12px 24px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;";
      nextBtn.onclick = () => {
        // Validate current page before proceeding (unless skipping validation)
        if (!shouldSkipValidation()) {
          const errors = validateCurrentPage(survey);
          if (errors.length > 0) {
            highlightErrors(errors);
            return;
          }
        }

        survey.nextPage();
        renderPage();
      };
      navDiv.appendChild(nextBtn);
    } else {
      const completeBtn = document.createElement("button");
      completeBtn.type = "button";
      completeBtn.textContent = i18n.t('navigationButtons.complete');
      completeBtn.style.cssText = "padding: 12px 24px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;";
      completeBtn.onclick = () => {
        // Validate all pages before completing (unless skipping validation)
        if (!shouldSkipValidation()) {
          const errors = validateCurrentPage(survey);
          if (errors.length > 0) {
            highlightErrors(errors);
            return;
          }
        }

        survey.completeLastPage();
      };
      navDiv.appendChild(completeBtn);
    }

    form.appendChild(navDiv);
    container.appendChild(form);
  };

  survey.onCurrentPageChanged.add(renderPage);

  // Only re-render on value change if it affects visibility (conditional logic)
  survey.onValueChanged.add(() => {
    // Check if any question visibility changed
    const currentPage = survey.currentPage;
    if (currentPage) {
      const visibilityChanged = currentPage.questions.some((q: any) => {
        const element = document.getElementById(`question-${q.name}`);
        return element && ((q.isVisible && element.style.display === 'none') ||
                          (!q.isVisible && element.style.display !== 'none'));
      });

      if (visibilityChanged) {
        renderPage();
      }
    }
  });

  renderPage();
}

function createInput(question: any, survey: Model): HTMLElement | null {
  const container = document.createElement("div");

  switch (question.getType()) {
    case "text":
    case "email":
      const textInput = document.createElement("input");
      textInput.type = question.inputType || "text";
      textInput.value = question.value || "";
      textInput.style.cssText = "width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;";
      textInput.placeholder = question.placeholder || "";
      textInput.oninput = (e) => {
        question.value = (e.target as HTMLInputElement).value;
      };
      return textInput;

    case "comment":
      const textarea = document.createElement("textarea");
      textarea.value = question.value || "";
      textarea.rows = 4;
      textarea.style.cssText = "width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical;";
      textarea.placeholder = question.placeholder || "";
      textarea.oninput = (e) => {
        question.value = (e.target as HTMLTextAreaElement).value;
      };
      return textarea;

    case "radiogroup":
      question.choices.forEach((choice: any) => {
        const label = document.createElement("label");
        label.style.cssText = "display: block; margin-bottom: 8px; cursor: pointer;";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = question.name;
        radio.value = choice.value || choice;
        radio.checked = question.value === (choice.value || choice);
        radio.style.cssText = "margin-right: 8px;";
        radio.onchange = () => {
          question.value = choice.value || choice;
        };

        label.appendChild(radio);
        label.appendChild(document.createTextNode(choice.text || choice));
        container.appendChild(label);
      });
      return container;

    case "checkbox":
      const values = Array.isArray(question.value) ? question.value : [];
      question.choices.forEach((choice: any) => {
        const label = document.createElement("label");
        label.style.cssText = "display: block; margin-bottom: 8px; cursor: pointer;";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = choice.value || choice;
        checkbox.checked = values.includes(choice.value || choice);
        checkbox.style.cssText = "margin-right: 8px;";
        checkbox.onchange = (e) => {
          const currentValues = Array.isArray(question.value) ? [...question.value] : [];
          if ((e.target as HTMLInputElement).checked) {
            currentValues.push(choice.value || choice);
          } else {
            const index = currentValues.indexOf(choice.value || choice);
            if (index > -1) currentValues.splice(index, 1);
          }
          question.value = currentValues;
        };

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(choice.text || choice));
        container.appendChild(label);
      });

      if (question.showOtherItem || question.hasOther) {
        const label = document.createElement("label");
        label.style.cssText = "display: block; margin-bottom: 8px; cursor: pointer;";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.style.cssText = "margin-right: 8px;";

        const otherInput = document.createElement("input");
        otherInput.type = "text";
        otherInput.placeholder = i18n.t('checkboxOther');
        otherInput.style.cssText = "margin-left: 8px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;";
        otherInput.disabled = true;

        checkbox.onchange = (e) => {
          const checked = (e.target as HTMLInputElement).checked;
          otherInput.disabled = !checked;
          if (!checked) otherInput.value = "";
        };

        otherInput.oninput = (e) => {
          const value = (e.target as HTMLInputElement).value;
          const currentValues = Array.isArray(question.value) ? [...question.value] : [];
          const otherIndex = currentValues.findIndex((v: string) => v.startsWith("other:"));
          if (otherIndex > -1) currentValues.splice(otherIndex, 1);
          if (value) currentValues.push(`other:${value}`);
          question.value = currentValues;
        };

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode("Other: "));
        label.appendChild(otherInput);
        container.appendChild(label);
      }
      return container;

    case "rating":
      const ratingDiv = document.createElement("div");
      ratingDiv.style.cssText = "display: flex; gap: 10px; align-items: center;";

      const min = question.rateMin || 0;
      const max = question.rateMax || 5;

      if (question.minRateDescription) {
        const minLabel = document.createElement("span");
        minLabel.textContent = question.minRateDescription;
        minLabel.style.cssText = "font-size: 12px; color: #666;";
        ratingDiv.appendChild(minLabel);
      }

      const ratingButtons: HTMLButtonElement[] = [];

      const updateButtonStyles = () => {
        ratingButtons.forEach((btn, index) => {
          const value = min + index;
          const isSelected = question.value === value;
          btn.style.cssText = `padding: 8px 16px; border: 2px solid ${isSelected ? '#1976d2' : '#ddd'}; background: ${isSelected ? '#1976d2' : 'white'}; color: ${isSelected ? 'white' : '#333'}; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;`;
        });
      };

      for (let i = min; i <= max; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = i.toString();
        btn.style.cssText = `padding: 8px 16px; border: 2px solid ${question.value === i ? '#1976d2' : '#ddd'}; background: ${question.value === i ? '#1976d2' : 'white'}; color: ${question.value === i ? 'white' : '#333'}; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;`;

        const currentValue = i;
        btn.onclick = () => {
          question.value = currentValue;
          updateButtonStyles();
        };

        ratingButtons.push(btn);
        ratingDiv.appendChild(btn);
      }

      if (question.maxRateDescription) {
        const maxLabel = document.createElement("span");
        maxLabel.textContent = question.maxRateDescription;
        maxLabel.style.cssText = "font-size: 12px; color: #666;";
        ratingDiv.appendChild(maxLabel);
      }

      return ratingDiv;

    case "ranking":
      const rankingDiv = document.createElement("div");
      rankingDiv.style.cssText = "display: flex; flex-direction: column; gap: 6px;";

      // Get all available choices - handle both string and object format
      const allChoices = question.visibleChoices || question.choices || [];
      const choiceValues = allChoices.map((choice: any) => {
        if (typeof choice === 'string') {
          return choice;
        }
        return choice.value || choice.text || choice;
      });

      // Initialize with randomized choices if no value set
      if (!question.value || !Array.isArray(question.value) || question.value.length === 0) {
        // Fisher-Yates shuffle algorithm
        const shuffled = [...choiceValues];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        question.value = shuffled;
      }

      let draggedIndex: number | null = null;

      const updateRankingDisplay = () => {
        rankingDiv.innerHTML = "";
        const currentRanking = question.value || choiceValues;

        if (currentRanking.length === 0) {
          rankingDiv.textContent = "No items to rank";
          return;
        }

        currentRanking.forEach((itemValue: any, index: number) => {
          const itemDiv = document.createElement("div");
          itemDiv.draggable = true;
          itemDiv.style.cssText = "display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fafafa; border-radius: 4px; cursor: move; transition: background 0.2s;";

          // Drag and drop event handlers
          itemDiv.ondragstart = () => {
            draggedIndex = index;
            itemDiv.style.opacity = "0.4";
          };

          itemDiv.ondragend = () => {
            itemDiv.style.opacity = "1";
            draggedIndex = null;
          };

          itemDiv.ondragover = (e) => {
            e.preventDefault();
            itemDiv.style.background = "#e3f2fd";
          };

          itemDiv.ondragleave = () => {
            itemDiv.style.background = "#fafafa";
          };

          itemDiv.ondrop = (e) => {
            e.preventDefault();
            itemDiv.style.background = "#fafafa";

            if (draggedIndex !== null && draggedIndex !== index) {
              const newRanking = [...currentRanking];
              const [draggedItem] = newRanking.splice(draggedIndex, 1);
              newRanking.splice(index, 0, draggedItem);
              question.value = newRanking;
              updateRankingDisplay();
            }
          };

          // Drag handle icon
          const dragHandle = document.createElement("span");
          dragHandle.textContent = "☰";
          dragHandle.style.cssText = "color: #999; cursor: grab; font-size: 14px; user-select: none;";
          itemDiv.appendChild(dragHandle);

          // Rank number
          const rankLabel = document.createElement("span");
          rankLabel.textContent = `${index + 1}.`;
          rankLabel.style.cssText = "font-weight: 600; min-width: 24px; color: #1976d2; font-size: 14px;";
          itemDiv.appendChild(rankLabel);

          // Item text - find the original choice to get display text
          const originalChoice = allChoices.find((c: any) => {
            const val = typeof c === 'string' ? c : (c.value || c.text);
            return val === itemValue;
          });

          const itemText = document.createElement("span");
          const displayText = typeof originalChoice === 'string'
            ? originalChoice
            : (originalChoice?.text || itemValue);
          itemText.textContent = displayText;
          itemText.style.cssText = "flex: 1; font-size: 14px;";
          itemDiv.appendChild(itemText);

          rankingDiv.appendChild(itemDiv);
        });
      };

      updateRankingDisplay();
      return rankingDiv;

    case "tagbox":
      const tagDiv = document.createElement("div");

      const tagInput = document.createElement("input");
      tagInput.type = "text";
      tagInput.placeholder = i18n.t('tagboxPlaceholder');
      tagInput.style.cssText = "width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 10px;";

      const tagsContainer = document.createElement("div");
      tagsContainer.style.cssText = "display: flex; flex-wrap: wrap; gap: 8px;";

      const updateTags = () => {
        tagsContainer.innerHTML = "";
        const values = Array.isArray(question.value) ? question.value : [];
        values.forEach((tag: string) => {
          const tagEl = document.createElement("span");
          tagEl.style.cssText = "background: #1976d2; color: white; padding: 5px 10px; border-radius: 16px; font-size: 14px; display: inline-flex; align-items: center; gap: 5px;";
          tagEl.textContent = tag;

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.textContent = "×";
          removeBtn.style.cssText = "background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 0; line-height: 1;";
          removeBtn.onclick = () => {
            const newValues = values.filter((v: string) => v !== tag);
            question.value = newValues;
          };

          tagEl.appendChild(removeBtn);
          tagsContainer.appendChild(tagEl);
        });
      };

      tagInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const value = tagInput.value.trim();
          if (value) {
            const currentValues = Array.isArray(question.value) ? [...question.value] : [];
            if (!currentValues.includes(value)) {
              currentValues.push(value);
              question.value = currentValues;
            }
            tagInput.value = "";
          }
        }
      };

      // Add preset choices as clickable options
      if (question.choices && question.choices.length > 0) {
        const choicesDiv = document.createElement("div");
        choicesDiv.style.cssText = "margin-bottom: 10px;";
        const choicesLabel = document.createElement("small");
        choicesLabel.textContent = i18n.t('tagboxSuggestions');
        choicesLabel.style.cssText = "color: #666;";
        choicesDiv.appendChild(choicesLabel);

        question.choices.forEach((choice: any) => {
          const choiceBtn = document.createElement("button");
          choiceBtn.type = "button";
          choiceBtn.textContent = choice.text || choice;
          choiceBtn.style.cssText = "margin: 2px; padding: 4px 8px; border: 1px solid #1976d2; background: white; color: #1976d2; border-radius: 12px; cursor: pointer; font-size: 12px;";
          choiceBtn.onclick = () => {
            const value = choice.value || choice;
            const currentValues = Array.isArray(question.value) ? [...question.value] : [];
            if (!currentValues.includes(value)) {
              currentValues.push(value);
              question.value = currentValues;
            }
          };
          choicesDiv.appendChild(choiceBtn);
        });
        tagDiv.appendChild(choicesDiv);
      }

      tagDiv.appendChild(tagInput);
      tagDiv.appendChild(tagsContainer);

      updateTags();
      survey.onValueChanged.add(() => updateTags());

      return tagDiv;

    default:
      const unsupported = document.createElement("div");
      unsupported.textContent = i18n.t('unsupportedQuestionType', { type: question.getType() });
      unsupported.style.cssText = "color: #999; font-style: italic;";
      return unsupported;
  }
}

// Initialize results table
async function initResults(): Promise<void> {
  const resultsElement = document.getElementById("resultsElement");
  if (!resultsElement) return;

  resultsElement.innerHTML = `<div style="padding: 20px; text-align: center;">${i18n.t('resultsView.loading')}</div>`;

  const responses = await loadResponses();

  resultsElement.innerHTML = "";

  if (responses.length === 0) {
    resultsElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>${i18n.t('resultsView.noResponses')}</p>
      </div>
    `;
    return;
  }

  // Show response count
  const countDiv = document.createElement("div");
  countDiv.className = "response-count";
  countDiv.textContent = `${i18n.t('resultsView.totalResponses')} ${responses.length}`;
  resultsElement.appendChild(countDiv);

  // Create download CSV button
  const downloadButton = document.createElement("button");
  downloadButton.textContent = i18n.t('resultsView.downloadCSV');
  downloadButton.style.cssText = "margin-left: 10px; padding: 10px 15px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;";
  downloadButton.onclick = () => {
    downloadCSV(responses);
  };
  resultsElement.appendChild(downloadButton);

  // Create table container
  const tableContainer = document.createElement("div");
  tableContainer.style.cssText = "margin-top: 20px; overflow-x: auto;";
  resultsElement.appendChild(tableContainer);

  // Create custom table
  renderResultsTable(responses, tableContainer);
}

// Render results as a simple HTML table
function renderResultsTable(responses: any[], container: HTMLElement): void {
  // Extract the data field and get all unique question names
  const transformedResponses = responses.map(r => ({
    timestamp: r.created_at,
    ...(r.data || r)
  }));

  // Get all unique keys from responses
  const allKeys = new Set<string>();
  transformedResponses.forEach(response => {
    Object.keys(response).forEach(key => allKeys.add(key));
  });

  // Create table
  const table = document.createElement("table");
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  `;

  // Create header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.style.cssText = "background: #f5f5f5; border-bottom: 2px solid #ddd;";

  Array.from(allKeys).forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    th.style.cssText = `
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #ddd;
      white-space: nowrap;
    `;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement("tbody");

  transformedResponses.forEach((response, index) => {
    const row = document.createElement("tr");
    row.style.cssText = `
      border-bottom: 1px solid #eee;
      ${index % 2 === 0 ? 'background: #fafafa;' : ''}
    `;

    Array.from(allKeys).forEach(key => {
      const td = document.createElement("td");
      const value = response[key];

      // Format the value
      if (key === 'timestamp') {
        td.textContent = value ? new Date(value).toLocaleString() : '-';
      } else if (Array.isArray(value)) {
        td.textContent = value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        td.textContent = JSON.stringify(value);
      } else {
        td.textContent = value !== undefined && value !== null ? String(value) : '-';
      }

      td.style.cssText = `
        padding: 12px;
        color: #666;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      row.appendChild(td);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// Download responses as CSV
function downloadCSV(responses: any[]): void {
  const transformedResponses = responses.map(r => ({
    timestamp: r.created_at,
    ...(r.data || r)
  }));

  if (transformedResponses.length === 0) {
    alert(i18n.t('noDataToDownload'));
    return;
  }

  // Get all keys
  const keys = new Set<string>();
  transformedResponses.forEach(r => Object.keys(r).forEach(k => keys.add(k)));
  const headers = Array.from(keys);

  // Create CSV content
  let csv = headers.join(',') + '\n';

  transformedResponses.forEach(response => {
    const row = headers.map(header => {
      const value = response[header];
      if (value === undefined || value === null) return '';

      // Handle arrays and objects
      let cellValue = Array.isArray(value) ? value.join(';') :
                     typeof value === 'object' ? JSON.stringify(value) :
                     String(value);

      // Escape quotes and wrap in quotes if contains comma or newline
      if (cellValue.includes(',') || cellValue.includes('\n') || cellValue.includes('"')) {
        cellValue = '"' + cellValue.replace(/"/g, '""') + '"';
      }

      return cellValue;
    });

    csv += row.join(',') + '\n';
  });

  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `survey-responses-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize analytics
async function initAnalytics(): Promise<void> {
  const analyticsElement = document.getElementById("analyticsElement");
  if (!analyticsElement) return;

  analyticsElement.innerHTML = `<div style="padding: 20px; text-align: center;">${i18n.t('analyticsView.loading')}</div>`;

  const responses = await loadResponses();

  analyticsElement.innerHTML = "";

  if (responses.length === 0) {
    analyticsElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>${i18n.t('analyticsView.noResponses')}</p>
      </div>
    `;
    return;
  }

  // Show response count
  const countDiv = document.createElement("div");
  countDiv.className = "response-count";
  countDiv.textContent = `${i18n.t('analyticsView.analyzing')} ${responses.length} responses`;
  analyticsElement.appendChild(countDiv);

  // Transform data for analytics - extract the data field and remove sensitive fields
  const transformedResponses = responses.map(r => {
    const data = r.data || r;
    // Remove name and email from analytics
    const { name, contact, ...analyticsData } = data;
    return analyticsData;
  });

  // Filter out sensitive questions from analytics
  const surveyConfig = i18n.getSurveyConfig();
  const allQuestions = new Model(surveyConfig).getAllQuestions();
  const analyticsQuestions = allQuestions.filter(q =>
    q.name !== 'name' && q.name !== 'contact'
  );

  // Create visualization panel
  const vizPanel = new VisualizationPanel(
    analyticsQuestions,
    transformedResponses
  );

  vizPanel.render(analyticsElement);
}

// Initialize names view
async function initNames(): Promise<void> {
  const namesElement = document.getElementById("namesElement");
  if (!namesElement) return;

  namesElement.innerHTML = `<div style="padding: 20px; text-align: center;">${i18n.t('namesView.loading')}</div>`;

  const responses = await loadResponses();

  namesElement.innerHTML = "";

  if (responses.length === 0) {
    namesElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>${i18n.t('namesView.noResponses')}</p>
      </div>
    `;
    return;
  }

  // Show response count
  const countDiv = document.createElement("div");
  countDiv.className = "response-count";
  countDiv.textContent = `${i18n.t('namesView.totalParticipants')} ${responses.length}`;
  namesElement.appendChild(countDiv);

  // Create names list
  const namesList = document.createElement("div");
  namesList.style.cssText = "margin-top: 20px;";

  // Extract names from responses
  const anonymousText = i18n.t('namesView.anonymous');
  const names = responses
    .map(r => {
      const data = r.data || r;
      return {
        name: data.name || anonymousText,
        timestamp: r.created_at
      };
    })
    .filter(item => item.name && item.name !== anonymousText);

  if (names.length === 0) {
    namesElement.innerHTML += `
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>${i18n.t('namesView.noNames')}</p>
      </div>
    `;
    return;
  }

  // Create a simple list of names
  const list = document.createElement("ul");
  list.style.cssText = `
    list-style: none;
    padding: 0;
    max-width: 600px;
    margin: 0 auto;
  `;

  names.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.style.cssText = `
      padding: 15px;
      margin-bottom: 10px;
      background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};
      border-radius: 4px;
      border-left: 4px solid #1976d2;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = item.name;
    nameSpan.style.cssText = "font-weight: 500; font-size: 16px;";

    const dateSpan = document.createElement("span");
    dateSpan.textContent = new Date(item.timestamp).toLocaleDateString();
    dateSpan.style.cssText = "color: #666; font-size: 14px;";

    listItem.appendChild(nameSpan);
    listItem.appendChild(dateSpan);
    list.appendChild(listItem);
  });

  namesList.appendChild(list);
  namesElement.appendChild(namesList);
}

// Check URL parameters to show/hide Results tab and handle direct view access
function checkResultsAccess(): void {
  const params = new URLSearchParams(window.location.search);
  const resultsTab = document.querySelector('[data-view="results"]') as HTMLElement;

  if (resultsTab) {
    if (params.has('results')) {
      resultsTab.style.display = '';
    } else {
      resultsTab.style.display = 'none';
    }
  }
}

// Check if URL specifies a direct view to load
function checkDirectView(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('view');
}

// Setup start survey button
function setupStartSurveyButton(): void {
  const startBtn = document.getElementById("startSurveyBtn");
  if (!startBtn) return;

  startBtn.onclick = () => {
    // Switch to form view
    const welcomeView = document.getElementById("welcomeView");
    const formView = document.getElementById("formView");

    if (welcomeView && formView) {
      welcomeView.classList.remove("active");
      formView.classList.add("active");

      // Initialize the survey
      initSurvey();
    }
  };
}

// Tab switching
function initTabs(): void {
  const tabs = document.querySelectorAll(".tab");
  const views = document.querySelectorAll(".view");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const viewName = (tab as HTMLElement).dataset.view;

      // Update active tab
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Update active view
      views.forEach((v) => v.classList.remove("active"));
      const targetView = document.getElementById(`${viewName}View`);
      if (targetView) {
        targetView.classList.add("active");
      }

      // Initialize the appropriate view
      switch (viewName) {
        case "welcome":
          // Welcome view is static, no initialization needed
          setupStartSurveyButton();
          break;
        case "form":
          initSurvey();
          break;
        case "names":
          initNames();
          break;
        case "results":
          initResults();
          break;
        case "analytics":
          initAnalytics();
          break;
      }
    });
  });
}

// Initialize app
// Countdown timer interval
let countdownInterval: ReturnType<typeof setInterval> | null = null;

// Update countdown timer every second
function startCountdownTimer(): void {
  const AUCTION_DATE = new Date('2025-11-24T18:00:00+02:00'); // Mon 24.11.2025 18:00 EEST

  const updateCountdown = () => {
    const timeToAuctionEl = document.getElementById('timeToAuction');
    if (!timeToAuctionEl) return;

    const now = new Date();
    const diffMs = AUCTION_DATE.getTime() - now.getTime();

    if (diffMs < 0) {
      timeToAuctionEl.textContent = i18n.t('auctionEnded');
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      return;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Format with proper pluralization
    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} ${i18n.formatTimeUnit('day', days)}`);
    }
    if (hours > 0 || days > 0) {
      parts.push(`${hours} ${i18n.formatTimeUnit('hour', hours)}`);
    }
    parts.push(`${minutes} ${i18n.formatTimeUnit('minute', minutes)}`);

    // Join with commas and "and" for the last item - language specific
    const lang = i18n.getLanguage();
    const andWord = lang === 'fi' ? 'ja' : 'and';
    timeToAuctionEl.textContent = parts.join(', ').replace(/,([^,]*)$/, ` ${andWord}$1`);
  };

  // Update immediately and then every minute
  updateCountdown();
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdownInterval = setInterval(updateCountdown, 60000); // Update every minute
}

// Calculate and update investment status on welcome page
async function updateInvestmentStatus(): Promise<void> {
  try {
    // Debug: Check environment variables
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_API_KEY);

    // Fetch responses
    const responses = await loadResponses();
    console.log('Loaded responses:', responses.length);

    // Calculate total investment
    const investmentMap: { [key: string]: number } = {
      '10k': 10000,
      '15k': 15000,
      '20k': 20000,
      '30k': 30000,
      '40k': 40000,
      '50k': 50000,
    };

    let totalInvestment = 0;
    responses.forEach((response: any) => {
      const data = response.data || response;
      const amount = data.investment_amount;
      if (amount && investmentMap[amount]) {
        totalInvestment += investmentMap[amount];
      }
    });

    // Update current investment display
    const currentInvestmentEl = document.getElementById('currentInvestment');
    if (currentInvestmentEl) {
      currentInvestmentEl.textContent = `${(totalInvestment / 1000).toFixed(0)}k€`;
    }

    // Start countdown timer
    startCountdownTimer();

  } catch (error) {
    console.error('Error updating investment status:', error);
    const currentInvestmentEl = document.getElementById('currentInvestment');
    if (currentInvestmentEl) {
      currentInvestmentEl.textContent = '0k€';
    }
    // Still start countdown even if investment fetch fails
    startCountdownTimer();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize language and translations
  initLanguageSelector();
  updateTranslations();

  checkResultsAccess();
  updateTabsVisibility();
  initTabs();

  // Check for direct view parameter in URL
  const directView = checkDirectView();

  if (directView) {
    // Direct view requested via URL parameter
    const welcomeView = document.getElementById("welcomeView");
    const targetView = document.getElementById(`${directView}View`);
    const targetTab = document.querySelector(`[data-view="${directView}"]`) as HTMLElement;

    if (targetView && targetTab && welcomeView) {
      // Hide welcome, show target view
      welcomeView.classList.remove("active");
      targetView.classList.add("active");
      targetTab.classList.add("active");

      // Show tabs if needed
      const tabs = document.getElementById('mainTabs');
      if (tabs) {
        tabs.style.display = 'flex';
      }

      // Initialize the appropriate view
      switch (directView) {
        case "form":
          initSurvey();
          break;
        case "names":
          initNames();
          break;
        case "results":
          initResults();
          break;
        case "analytics":
          initAnalytics();
          break;
      }
    }
  } else if (hasCompletedForm()) {
    // Check if user has completed the form before
    // Show form view with tabs visible
    const welcomeView = document.getElementById("welcomeView");
    const formView = document.getElementById("formView");

    if (welcomeView && formView) {
      welcomeView.classList.remove("active");
      formView.classList.add("active");

      // Activate the form tab
      const formTab = document.querySelector('[data-view="form"]');
      if (formTab) {
        formTab.classList.add("active");
      }
    }

    initSurvey();
  } else {
    // Show welcome view and setup start button
    setupStartSurveyButton();
    // Update investment status on welcome page
    updateInvestmentStatus();
  }

  // Also update when navigating to welcome view
  const welcomeTab = document.querySelector('[data-view="welcome"]');
  if (welcomeTab) {
    welcomeTab.addEventListener('click', () => {
      setTimeout(updateInvestmentStatus, 100);
    });
  }
});

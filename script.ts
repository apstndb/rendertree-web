
import { initWasm } from './rendertree.js';
import type { RenderedNode } from './rendertree.js';

// Font size adjustment constants
const MIN_FONT_SIZE = 8; // Minimum font size in pixels
const DEFAULT_FONT_SIZE = 14; // Default font size in pixels
const MIN_CONTAINER_HEIGHT = 100; // Minimum height for the container in pixels

let wasmFunctions: { renderASCII: (input: string, mode: string) => string; } | null = null;

async function initializeWasm() {
    try {
        wasmFunctions = await initWasm();
        console.log("WebAssembly initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize WebAssembly:", error);
        updatePlaceholder("Error: Failed to load rendering engine.");
    }
}

// Local storage keys
const FONT_SIZE_STORAGE_KEY = 'rendertree-font-size';

/**
 * Updates the text content of the placeholder element.
 * @param message - The message to display.
 */
function updatePlaceholder(message: string): void {
    const placeholder = document.getElementById('placeholder');
    if (placeholder) {
        placeholder.textContent = message;
    }
}

/**
 * Setup resize handler for the pre container
 * @param container - The container element to resize
 * @param handle - The resize handle element
 */
function setupResizeHandler(container: HTMLElement, handle: HTMLElement): void {
    let startY = 0;
    let startHeight = 0;

    const onMouseDown = (e: MouseEvent): void => {
        startY = e.clientY;
        startHeight = parseInt(window.getComputedStyle(container).height, 10); // Use window.getComputedStyle
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
        e.preventDefault(); // Prevent text selection during drag
    };

    const doDrag = (e: MouseEvent): void => {
        const newHeight = Math.max(MIN_CONTAINER_HEIGHT, startHeight + e.clientY - startY);
        container.style.height = `${newHeight}px`;
        e.preventDefault();
    };

    const stopDrag = (): void => {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
    };

    handle.addEventListener('mousedown', onMouseDown, false);
}

/**
 * Gets the stored font size from local storage or returns the default.
 * @returns Font size in pixels.
 */
function getStoredFontSize(): number {
    const storedSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return storedSize ? parseInt(storedSize, 10) : DEFAULT_FONT_SIZE; // Added radix for parseInt
}

/**
 * Stores the font size in local storage.
 * @param fontSize - Font size in pixels.
 */
function storeFontSize(fontSize: number): void {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize.toString());
}

/**
 * Updates the font size display element with the current font size.
 * @param fontSize - Font size in pixels.
 */
function updateFontSizeDisplay(fontSize: number): void {
    const fontSizeDisplay = document.getElementById('font-size-display');
    if (fontSizeDisplay) {
        fontSizeDisplay.textContent = `${fontSize}px`;
    }
}

/**
 * Sets the font size of an element and updates related UI.
 * @param element - The element to adjust.
 * @param fontSize - Font size in pixels.
 */
function setFontSize(element: HTMLElement, fontSize: number): void {
    element.style.fontSize = `${fontSize}px`;
    updateFontSizeDisplay(fontSize);
    storeFontSize(fontSize);
}

interface UIElements {
    inputElement: HTMLTextAreaElement;
    renderTypeElement: HTMLSelectElement;
    renderModeElement: HTMLSelectElement;
}

/**
 * Helper function to get required UI elements.
 * Throws an error if any required element is not found.
 * @returns Object containing required UI elements.
 */
function getUIElements(): UIElements {
    const inputElement = document.getElementById("input") as HTMLTextAreaElement | null;
    const renderTypeElement = document.getElementById("renderType") as HTMLSelectElement | null;
    const renderModeElement = document.getElementById("renderMode") as HTMLSelectElement | null;

    if (!inputElement) {
        throw new Error("Input element with ID 'input' not found.");
    }
    if (!renderTypeElement) {
        throw new Error("Render type select element with ID 'renderType' not found.");
    }
    if (!renderModeElement) {
        throw new Error("Render mode select element with ID 'renderMode' not found.");
    }

    return { inputElement, renderTypeElement, renderModeElement };
}

/**
 * Renders the query plan based on current input and selected options.
 * @returns boolean indicating if rendering was successful.
 */
function renderSelected(): boolean {
    try {
        const elements = getUIElements();
        const { inputElement, renderTypeElement, renderModeElement } = elements;

        const input = inputElement.value.trim();
        const renderType = renderTypeElement.value;
        const renderMode = renderModeElement.value;

        if (!input) {
            console.log("No input to render");
            updatePlaceholder('Please provide input for the query plan.');
            return false;
        }

        console.log(`Rendering with type: ${renderType}, mode: ${renderMode}`);
        updatePlaceholder('Rendering...');


        if (renderType === "ascii") {
            if (wasmFunctions) {
                ascii(input, renderMode); // ascii function will call wasmFunctions.renderASCII internally
            } else {
                updatePlaceholder("Error: Rendering engine not loaded.");
            }
        }

        // Consider if this timeout is strictly necessary or if there's a more direct way to ensure elements are ready.
        setTimeout(setupFontSizeControls, 100);
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error during rendering:", message);
        updatePlaceholder(`Error during rendering: ${message}`);
        return false;
    }
}


/**
 * Handles file input and reads the file.
 */
function handleFileInput(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const files = fileInput.files;

    if (!files || files.length === 0) {
        console.log("No file selected");
        return;
    }

    const file = files.item(0);
    if (!file) {
        console.log("No file selected, or file is not accessible.");
        return;
    }

    console.log(`File selected: ${file.name}`);

    const reader = new FileReader();

    reader.onload = function(e: ProgressEvent<FileReader>) {
        const content = e.target?.result;

        if (typeof content !== 'string') {
            console.error("Empty or invalid file content");
            updatePlaceholder('Error: Could not read file content.');
            return;
        }

        try {
            const { inputElement } = getUIElements();
            inputElement.value = content;
            renderSelected();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error setting input value or auto-rendering from file:", message);
            updatePlaceholder(`Error processing file: ${message}`);
        }
    };

    reader.onerror = function() {
        console.error("Error reading file:", reader.error);
        updatePlaceholder(`Error reading file: ${reader.error?.message || 'Unknown error'}`);
    };

    reader.readAsText(file);
}

/**
 * Initialize UI elements and set up event listeners.
 */
function initializeUI(): void {
    console.log('Initializing UI...');

    const placeholder = document.getElementById('placeholder');
    const contentContainer = document.getElementById('content-container');

    if (placeholder && contentContainer) {
        Object.assign(placeholder.style, {
            width: '100%',
            height: '100%'
        });

        Object.assign(contentContainer.style, {
            flex: '1',
            display: 'flex',
            flexDirection: 'column'
        });
    } else {
        console.warn("Placeholder or content-container not found during UI initialization.");
    }

    const fileInput = document.getElementById('fileInput');
    const renderButton = document.getElementById('renderButton');

    fileInput?.addEventListener('change', handleFileInput);
    renderButton?.addEventListener('click', renderSelected);

    try {
        setupFontSizeControls();
    } catch(error) {
        console.warn("Could not initialize font size controls on DOMContentLoaded:", error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initializeWasm();
    initializeUI();
});

/**
 * Calculates the optimal font size to avoid horizontal scrollbar
 * @param preElement - The pre element containing the content
 * @param text - The text content
 * @returns Optimal font size in pixels
 */
function calculateInitialFontSize(preElement: HTMLElement, text: string): number {
    const tempElement = document.createElement('div');
    tempElement.style.visibility = 'hidden';
    tempElement.style.position = 'absolute';
    tempElement.style.whiteSpace = 'pre';
    tempElement.style.fontFamily = window.getComputedStyle(preElement).fontFamily || "Consolas, 'Courier New', Courier, monospace";

    const lines = text.split('\n');
    const maxLineLength = lines.length > 0 ? Math.max(...lines.map(line => line.length)) : 0;

    if (maxLineLength === 0) {
        return DEFAULT_FONT_SIZE;
    }
    tempElement.textContent = 'X'.repeat(maxLineLength);
    document.body.appendChild(tempElement);

    let minSize = MIN_FONT_SIZE;
    let maxSize = DEFAULT_FONT_SIZE * 2; // Allow searching for larger fonts than default
    let optimalSize = DEFAULT_FONT_SIZE;

    const containerWidth = preElement.clientWidth > 20 ? preElement.clientWidth - 20 : preElement.clientWidth; // Subtract padding
    if (containerWidth <= 0) { // Safety check
        document.body.removeChild(tempElement);
        return DEFAULT_FONT_SIZE;
    }

    while (minSize <= maxSize) {
        const currentSize = Math.floor((minSize + maxSize) / 2);
        if (currentSize < MIN_FONT_SIZE) break;

        tempElement.style.fontSize = `${currentSize}px`;

        if (tempElement.scrollWidth > containerWidth) {
            maxSize = currentSize - 1;
        } else {
            optimalSize = currentSize;
            minSize = currentSize + 1;
        }
    }

    document.body.removeChild(tempElement);
    return Math.max(MIN_FONT_SIZE, optimalSize);
}


/**
 * Calculates optimal height for container based on content.
 * @param preElement - The pre element containing the content.
 * @param text - The text content.
 * @returns Optimal height in pixels.
 */
function calculateOptimalHeight(preElement: HTMLElement, text: string): number {
    const lines = text.split('\n');
    const lineCount = lines.length;

    if (lineCount === 0) return MIN_CONTAINER_HEIGHT;

    const computedStyle = window.getComputedStyle(preElement);
    const fontSize = parseFloat(computedStyle.fontSize);
    // Use 'lineHeight' if it's a specific value, otherwise estimate based on font size.
    // 'normal' typically translates to around 1.2 to 1.5 times the font size.
    const lineHeightValue = computedStyle.lineHeight;
    let lineHeight: number;
    if (lineHeightValue === 'normal' || !lineHeightValue) {
        lineHeight = fontSize * 1.4; // Adjusted factor for better estimation
    } else {
        lineHeight = parseFloat(lineHeightValue);
    }

    // Ensure lineHeight is a positive number
    if (isNaN(lineHeight) || lineHeight <=0) {
        lineHeight = fontSize * 1.4;
    }


    const contentHeight = lineCount * lineHeight;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

    return Math.max(MIN_CONTAINER_HEIGHT, contentHeight + paddingTop + paddingBottom);
}

/**
 * Adjusts container height based on content
 * @param {HTMLElement} container - The container to adjust
 * @param {HTMLElement} preElement - The pre element with content
 * @param {string} text - The text content
 */
function adjustContainerHeight(container: HTMLElement, preElement: HTMLElement, text: string): void {
    const optimalHeight = calculateOptimalHeight(preElement, text);
    container.style.height = optimalHeight + 'px';
}



function copyToClipboard(text: string): Promise<boolean> {
    // Copy text to clipboard using the Clipboard API
    return navigator.clipboard.writeText(text)
        .then(() => {
            console.log('Text copied to clipboard');
            return true;
        })
        .catch(err => {
            console.error('Failed to copy text to clipboard:', err);
            return false;
        });
}

function ascii(input: string, mode: string): void {
    if (!wasmFunctions) {
        updatePlaceholder("Error: Rendering engine not loaded for ASCII rendering.");
        return;
    }
    const result = wasmFunctions.renderASCII(input, mode);

    const placeholder = document.getElementById("placeholder");
    if (!placeholder) return;

    placeholder.innerHTML = "";

    // Create pre container for positioning
    const preContainer = document.createElement('div');
    preContainer.className = 'pre-container';
    preContainer.id = 'pre-container';

    // Remove the fixed height to allow dynamic calculation
    preContainer.style.height = 'auto';

    // Create pre element
    const pre = document.createElement('pre');
    pre.style.fontFamily = "monospace";
    pre.style.whiteSpace = "pre";
    pre.style.border = "solid";
    pre.style.padding = "10px";
    pre.style.marginTop = "0";
    pre.style.position = "relative";
    pre.style.overflow = "auto"; // Enable both horizontal and vertical scrolling
    pre.style.maxWidth = "100%"; // Ensure it doesn't exceed container width
    pre.style.flex = "1 1 auto"; // Fill available space
    pre.style.boxSizing = "border-box"; // Include padding in the height calculation
    pre.style.margin = "0"; // Remove margin
    pre.id = 'result-pre';

    // Create code element
    const code = document.createElement('code');
    code.innerText = result;
    code.style.fontFamily = "Consolas, 'Courier New', Courier, monospace";
    code.id = 'result-code';

    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.style.right = '5px'; // 明示的に右側に配置
    copyButton.style.left = 'auto'; // 左側の配置をリセット

    // Copy button click event handler
    copyButton.addEventListener('click', function () {
        copyToClipboard(code.innerText).then((success) => {
            if (success) {
                // Visual feedback on successful copy
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');

                // Reset button state after 2 seconds
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            }
        });
    });

    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.title = 'Drag to resize';

    // Assemble elements
    pre.appendChild(code);
    preContainer.appendChild(pre);
    preContainer.appendChild(copyButton);
    preContainer.appendChild(resizeHandle);
    placeholder.appendChild(preContainer);

    // Set up resize functionality
    setupResizeHandler(preContainer, resizeHandle);

    // Set font size and adjust container height after elements are in the DOM
    setTimeout(() => {
        // Determine the font size to use
        let fontSize: number;

        // Check if this is the first render (no stored font size)
        if (!localStorage.getItem(FONT_SIZE_STORAGE_KEY)) {
            // First render - calculate optimal font size to avoid scrollbar
            fontSize = calculateInitialFontSize(pre, result);
        } else {
            // Use the stored font size from previous renders
            fontSize = getStoredFontSize();
        }

        // Set the font size and update the display
        setFontSize(code, fontSize);

        // Adjust container height based on content
        adjustContainerHeight(preContainer, pre, result);

        // Add window resize handler to adjust container height only (not font size)
        const resizeHandler = () => {
            adjustContainerHeight(preContainer, pre, result);
        };

        // Add resize event listener
        window.addEventListener('resize', resizeHandler);

        // Store the resize handler on the container element for cleanup if needed
        preContainer.dataset.resizeHandler = 'true';
    }, 0);
}


// Setup font size and height control buttons
function setupFontSizeControls(): void {
    const codeElement = document.getElementById('result-code');
    const preContainer = document.getElementById('pre-container');

    if (!codeElement || !preContainer) {
        // If result-code element is not yet in the DOM, do nothing
        return;
    }

    // Display the current font size correctly on initial load
    const currentSize = parseInt(window.getComputedStyle(codeElement).fontSize);
    updateFontSizeDisplay(currentSize);

    // Font size controls
    const decreaseBtn = document.getElementById('decrease-font');
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            const currentSizePx = window.getComputedStyle(codeElement).fontSize;
            const currentSizeNum = parseInt(currentSizePx);
            const newSize = Math.max(MIN_FONT_SIZE, currentSizeNum - 1);
            setFontSize(codeElement, newSize);
        });
    }

    const increaseBtn = document.getElementById('increase-font');
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            const currentSizePx = window.getComputedStyle(codeElement).fontSize;
            const currentSizeNum = parseInt(currentSizePx);
            const newSize = currentSizeNum + 1;
            setFontSize(codeElement, newSize);
        });
    }

    // Height controls (these logics are not directly related to font display issues, so no changes)
    const decreaseHeightBtn = document.getElementById('decrease-height');
    if (decreaseHeightBtn) {
        decreaseHeightBtn.addEventListener('click', function() {
            const currentHeight = parseInt(window.getComputedStyle(preContainer).height);
            preContainer.style.height = `${Math.max(MIN_CONTAINER_HEIGHT, currentHeight - 50)}px`;
        });
    }

    const resetHeightBtn = document.getElementById('reset-height');
    if (resetHeightBtn) {
        resetHeightBtn.addEventListener('click', function() {
            const pre = document.getElementById('result-pre');
            // codeElement is already obtained within the scope of this function
            if (pre && codeElement) {
                adjustContainerHeight(preContainer, pre, codeElement.innerText);
                pre.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    const increaseHeightBtn = document.getElementById('increase-height');
    if (increaseHeightBtn) {
        increaseHeightBtn.addEventListener('click', function() {
            const currentHeight = parseInt(window.getComputedStyle(preContainer).height);
            preContainer.style.height = `${currentHeight + 50}px`;
        });
    }
}

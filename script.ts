/**
 * @function renderASCII
 * @global
 * @description Renders the input Spanner execution plan as ASCII art.
 * This function is globally exposed by the 'rendertree.wasm' WebAssembly module
 * and becomes available after WebAssembly.instantiateStreaming and go.run() complete.
 * @param {string} input - The text to be rendered.
 * @returns {string} The ASCII art representation as a string.
 */
declare function renderASCII(input: string, mode: string): string;

/**
 * @function render
 * @global
 * @description Renders the input Spanner execution plan as structured data.
 * This function is globally exposed by the 'rendertree.wasm' WebAssembly module
 * and becomes available after WebAssembly.instantiateStreaming and go.run() complete.
 * @param {string} input - The text to be rendered.
 * @param {string} mode - The rendering mode.
 * @returns {string} The JSON string representation of the rendered plan.
 */
declare function render(input: string, mode: string): string;

// Declare Go class from wasm_exec.js
declare class Go {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<void>;
}

// Define interfaces for the rendered node structure
interface RenderedNode {
    Predicates: string[] | null;
    ID: string;
    TreePart: string;
    NodeText: string;
}

const go = new Go();

// Font size adjustment constants
const MIN_FONT_SIZE = 8; // Minimum font size in pixels
const DEFAULT_FONT_SIZE = 14; // Default font size in pixels
const MIN_CONTAINER_HEIGHT = 100; // Minimum height for the container in pixels

// Local storage keys
const FONT_SIZE_STORAGE_KEY = 'rendertree-font-size';

/**
 * Setup resize handler for the pre container
 * @param {HTMLElement} container - The container element to resize
 * @param {HTMLElement} handle - The resize handle element
 */
function setupResizeHandler(container: HTMLElement, handle: HTMLElement): void {
    let startY = 0;
    let startHeight = 0;

    handle.addEventListener('mousedown', function(e: MouseEvent) {
        startY = e.clientY;
        startHeight = parseInt(document.defaultView!.getComputedStyle(container).height, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
        e.preventDefault(); // Prevent text selection during drag
    }, false);

    function doDrag(e: MouseEvent): void {
        const newHeight = Math.max(MIN_CONTAINER_HEIGHT, startHeight + e.clientY - startY);
        container.style.height = newHeight + 'px';
        e.preventDefault();
    }

    function stopDrag(e: MouseEvent): void {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }
}

/**
 * Gets the stored font size from local storage or returns the default
 * @returns {number} - Font size in pixels
 */
function getStoredFontSize(): number {
    const storedSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return storedSize ? parseInt(storedSize) : DEFAULT_FONT_SIZE;
}

/**
 * Stores the font size in local storage
 * @param {number} fontSize - Font size in pixels
 */
function storeFontSize(fontSize: number): void {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize.toString());
}

/**
 * Updates the font size display element with the current font size
 * @param {number} fontSize - Font size in pixels
 */
function updateFontSizeDisplay(fontSize: number): void {
    const fontSizeDisplay = document.getElementById('font-size-display');
    if (fontSizeDisplay) {
        fontSizeDisplay.textContent = `${fontSize}px`;
    }
}

/**
 * Sets the font size of an element and updates related UI
 * @param {HTMLElement} element - The element to adjust
 * @param {number} fontSize - Font size in pixels
 */
function setFontSize(element: HTMLElement, fontSize: number): void {
    element.style.fontSize = `${fontSize}px`;
    updateFontSizeDisplay(fontSize);
    storeFontSize(fontSize);
}

/**
 * Calculates the optimal font size to avoid horizontal scrollbar
 * @param {HTMLElement} preElement - The pre element containing the content
 * @param {string} text - The text content
 * @returns {number} - Optimal font size in pixels
 */
/**
 * Helper function to get required UI elements
 * @returns Object containing required UI elements or null if any is missing
 */
function getUIElements() {
    const inputElement = document.getElementById("input") as HTMLTextAreaElement;
    const renderTypeElement = document.getElementById("renderType") as HTMLSelectElement;
    const renderModeElement = document.getElementById("renderMode") as HTMLSelectElement;
    
    if (!inputElement || !renderTypeElement || !renderModeElement) {
        console.error("Required elements not found for rendering");
        return null;
    }
    
    return { inputElement, renderTypeElement, renderModeElement };
}

/**
 * Renders the query plan based on current input and selected options
 * @returns boolean indicating if rendering was successful
 */
function renderSelected(): boolean {
    const elements = getUIElements();
    if (!elements) return false;
    
    const { inputElement, renderTypeElement, renderModeElement } = elements;
    const input = inputElement.value.trim();
    const renderType = renderTypeElement.value;
    const renderMode = renderModeElement.value;

    // Skip rendering if input is empty
    if (!input) {
        console.log("No input to render");
        return false;
    }

    console.log(`Rendering with type: ${renderType}, mode: ${renderMode}`);

    try {
        if (renderType === "table") {
            table(render(input, renderMode), renderMode);
        } else if (renderType === "ascii") {
            ascii(input, renderMode);
        }
        
        // Setup font size control buttons after rendering
        setTimeout(setupFontSizeControls, 100);
        return true;
    } catch (error) {
        console.error("Error during rendering:", error);
        return false;
    }
}

/**
 * Handles file input and reads the file
 */
function handleFileInput(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const files = fileInput.files;

    if (!files || files.length === 0) {
        console.log("No file selected");
        return;
    }

    // TypeScriptに files[0] が必ず存在することを明示的に伝える
    const file = files[0]!; // 非nullアサーション演算子を使用
    console.log(`File selected: ${file.name}`);

    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target?.result as string;
        const elements = getUIElements();
        
        if (!elements || !content) {
            console.error("Missing required elements or empty file content");
            return;
        }
        
        elements.inputElement.value = content;
        // Automatically render when file is loaded
        renderSelected();
    };

    reader.onerror = function() {
        console.error("Error reading file:", reader.error);
    };

    reader.readAsText(file);
}

/**
 * Initialize UI elements and set up event listeners
 */
function initializeUI(): void {
    console.log('Initializing UI...');

    // Make the placeholder responsive to window size
    const placeholder = document.getElementById('placeholder');
    const contentContainer = document.getElementById('content-container');

    if (placeholder && contentContainer) {
        // Apply styles in a more concise way
        Object.assign(placeholder.style, {
            width: '100%',
            height: '100%'
        });
        
        Object.assign(contentContainer.style, {
            flex: '1',
            display: 'flex',
            flexDirection: 'column'
        });
    }

    // Set up event listeners
    const fileInput = document.getElementById('fileInput');
    const renderButton = document.getElementById('renderButton');

    fileInput?.addEventListener('change', handleFileInput);
    renderButton?.addEventListener('click', renderSelected);

    // Initialize font size controls
    setupFontSizeControls();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI);

function calculateInitialFontSize(preElement: HTMLElement, text: string): number {
    // Create a temporary element to measure text width
    const tempElement = document.createElement('div');
    tempElement.style.visibility = 'hidden';
    tempElement.style.position = 'absolute';
    tempElement.style.whiteSpace = 'pre';
    tempElement.style.fontFamily = "Consolas, 'Courier New', Courier, monospace";

    // Find the longest line in the text
    const lines = text.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    tempElement.textContent = 'X'.repeat(maxLineLength);

    document.body.appendChild(tempElement);

    // Binary search to find the largest font size that doesn't cause horizontal scrollbar
    let minSize = MIN_FONT_SIZE;
    let maxSize = DEFAULT_FONT_SIZE;
    let currentSize = DEFAULT_FONT_SIZE;
    const containerWidth = preElement.clientWidth - 20; // 20px for padding

    while (minSize <= maxSize) {
        currentSize = Math.floor((minSize + maxSize) / 2);
        tempElement.style.fontSize = `${currentSize}px`;

        if (tempElement.scrollWidth > containerWidth) {
            maxSize = currentSize - 1;
        } else {
            minSize = currentSize + 1;
        }
    }

    document.body.removeChild(tempElement);
    return Math.max(MIN_FONT_SIZE, maxSize);
}

/**
 * Calculates optimal height for container based on content
 * @param {HTMLElement} preElement - The pre element containing the content
 * @param {string} text - The text content
 * @returns {number} - Optimal height in pixels
 */
function calculateOptimalHeight(preElement: HTMLElement, text: string): number {
    // Count number of lines
    const lineCount = text.split('\n').length;

    // Get line height from computed style
    const computedStyle = window.getComputedStyle(preElement);
    const lineHeight = parseInt(computedStyle.lineHeight) || 
                      parseInt(computedStyle.fontSize) * 1.2; // Fallback if lineHeight is 'normal'

    // Calculate content height (lines * line height)
    const contentHeight = lineCount * lineHeight;

    // Add padding
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;

    // Calculate total height
    const totalHeight = contentHeight + paddingTop + paddingBottom;

    // Constrain within min and max bounds
    const minHeight = 100; // Same as CSS min-height

    // Calculate available viewport height
    const viewportHeight = window.innerHeight;

    // Calculate height of other elements
    const inputElement = document.getElementById('input');
    const controlsElement = document.querySelector('.render-controls');
    const footer = document.querySelector('footer');

    let otherElementsHeight = 0;

    if (inputElement) {
        otherElementsHeight += inputElement.getBoundingClientRect().height;
    }

    if (controlsElement) {
        otherElementsHeight += controlsElement.getBoundingClientRect().height;
    }

    if (footer) {
        otherElementsHeight += footer.getBoundingClientRect().height;
    }

    // Add some padding
    otherElementsHeight += 40; // 20px top and bottom padding

    // Calculate maximum available height
    const maxHeight = viewportHeight - otherElementsHeight;

    // Return the appropriate height
    if (totalHeight < minHeight) {
        return minHeight;
    } else if (totalHeight > maxHeight) {
        return maxHeight;
    } else {
        return totalHeight;
    }
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

function handleFileUpload(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0]!;
    const reader = new FileReader();
    reader.onload = function (e: ProgressEvent<FileReader>) {
        const inputElement = document.getElementById('input') as HTMLTextAreaElement;
        if (inputElement && e.target && typeof e.target.result === 'string') {
            inputElement.value = e.target.result;
        }
    };
    reader.readAsText(file);
}

// Initialize control buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get control buttons
    const resetHeightBtn = document.getElementById('reset-height');

    // Add event listener for auto height adjustment
    if (resetHeightBtn) {
        resetHeightBtn.addEventListener('click', function() {
            const preContainer = document.getElementById('pre-container');
            const pre = document.getElementById('result-pre');
            const code = document.getElementById('result-code');

            if (preContainer && pre && code) {
                adjustContainerHeight(preContainer, pre, code.innerText);
            }
        });
    }
});

WebAssembly.instantiateStreaming(fetch("dist/rendertree.wasm"), go.importObject).then((result) => {
    go.run(result.instance);
});

const PREDICATE_MARKER = "*";

function createTableRow(table: HTMLTableElement, node: RenderedNode, index: number): HTMLTableRowElement {
    const { Predicates, ID, TreePart, NodeText } = node;
    const row = table.insertRow(index);
    const idCell = row.insertCell(0);
    const nodeCell = row.insertCell(1);

    idCell.innerText = (Predicates !== null && Predicates.length > 0 ? PREDICATE_MARKER : "") + ID;
    idCell.style.textAlign = "right";

    nodeCell.style.whiteSpace = "pre";
    const codeElement = document.createElement('code');
    codeElement.textContent = TreePart + NodeText;
    nodeCell.appendChild(codeElement);
    return row;
}

function table(input: string, mode: string): void {
    // unmarshal JSON
    const renderedNodes: RenderedNode[] = JSON.parse(input);
    const placeholder = document.getElementById("placeholder");
    if (!placeholder) return;

    placeholder.innerHTML = "";

    const table = document.createElement('table');

    renderedNodes.forEach((node, i) => {
        createTableRow(table, node, i);
    });
    placeholder.appendChild(table);
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
    const result = renderASCII(input, mode);

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
        decreaseBtn.onclick = function() {
            const currentSizePx = window.getComputedStyle(codeElement).fontSize;
            const currentSizeNum = parseInt(currentSizePx);
            const newSize = Math.max(MIN_FONT_SIZE, currentSizeNum - 1);
            setFontSize(codeElement, newSize);
        };
    }

    const increaseBtn = document.getElementById('increase-font');
    if (increaseBtn) {
        increaseBtn.onclick = function() {
            const currentSizePx = window.getComputedStyle(codeElement).fontSize;
            const currentSizeNum = parseInt(currentSizePx);
            const newSize = currentSizeNum + 1;
            setFontSize(codeElement, newSize);
        };
    }

    // Height controls (these logics are not directly related to font display issues, so no changes)
    const decreaseHeightBtn = document.getElementById('decrease-height');
    if (decreaseHeightBtn) {
        decreaseHeightBtn.onclick = function() {
            const currentHeight = parseInt(window.getComputedStyle(preContainer).height);
            preContainer.style.height = `${Math.max(MIN_CONTAINER_HEIGHT, currentHeight - 50)}px`;
        };
    }

    const resetHeightBtn = document.getElementById('reset-height');
    if (resetHeightBtn) {
        resetHeightBtn.onclick = function() {
            const pre = document.getElementById('result-pre');
            // codeElement is already obtained within the scope of this function
            if (pre && codeElement) {
                adjustContainerHeight(preContainer, pre, codeElement.innerText);
                pre.scrollIntoView({ behavior: 'smooth' });
            }
        };
    }

    const increaseHeightBtn = document.getElementById('increase-height');
    if (increaseHeightBtn) {
        increaseHeightBtn.onclick = function() {
            const currentHeight = parseInt(window.getComputedStyle(preContainer).height);
            preContainer.style.height = `${currentHeight + 50}px`;
        };
    }
}

// Add event listeners once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up file upload handler
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Set up render button
    const renderButton = document.getElementById('renderButton');
    if (renderButton) {
        renderButton.addEventListener('click', renderSelected);
    }

    // Since result-code element does not exist at DOMContentLoaded, remove setupFontSizeControls call here.
    // setupFontSizeControls();
});

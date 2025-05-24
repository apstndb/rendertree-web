/**
 * @function renderASCII
 * @global
 * @description Renders the input Spanner execution plan as ASCII art.
 * This function is globally exposed by the 'rendertree.wasm' WebAssembly module
 * and becomes available after WebAssembly.instantiateStreaming and go.run() complete.
 * @param {string} input - The text to be rendered.
 * @returns {string} The ASCII art representation as a string.
 */

const go = new Go();

// Font size adjustment constants
const MIN_FONT_SIZE = 8; // Minimum font size in pixels
const DEFAULT_FONT_SIZE = 14; // Default font size in pixels
const CHAR_WIDTH_RATIO = 0.6; // Approximate width-to-height ratio for monospace fonts
const MIN_CONTAINER_HEIGHT = 100; // Minimum height for the container in pixels

/**
 * Setup resize handler for the pre container
 * @param {HTMLElement} container - The container element to resize
 * @param {HTMLElement} handle - The resize handle element
 */
function setupResizeHandler(container, handle) {
    let startY = 0;
    let startHeight = 0;
    
    handle.addEventListener('mousedown', function(e) {
        startY = e.clientY;
        startHeight = parseInt(document.defaultView.getComputedStyle(container).height, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
        e.preventDefault(); // Prevent text selection during drag
    }, false);
    
    function doDrag(e) {
        const newHeight = Math.max(MIN_CONTAINER_HEIGHT, startHeight + e.clientY - startY);
        container.style.height = newHeight + 'px';
        e.preventDefault();
    }
    
    function stopDrag(e) {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }
}

/**
 * Calculates optimal font size to fit content within container width
 * @param {string} text - The text content to measure
 * @param {number} containerWidth - Available width in pixels
 * @param {string} fontFamily - Font family to use for measurement
 * @returns {number} - Optimal font size in pixels
 */
function calculateOptimalFontSize(text, containerWidth, fontFamily) {
    // Find the longest line in the text
    const lines = text.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    // Calculate approximate width of the longest line at 1px font size
    // This is an approximation as actual character width varies
    const approximateTextWidth = maxLineLength * CHAR_WIDTH_RATIO;
    
    // Calculate font size that would make the text fit
    let fontSize = containerWidth / approximateTextWidth;
    
    // Apply constraints
    fontSize = Math.max(MIN_FONT_SIZE, Math.min(DEFAULT_FONT_SIZE, fontSize));
    
    return fontSize;
}

/**
 * Adjusts font size of an element to fit its content
 * @param {HTMLElement} element - The element to adjust
 * @param {string} text - The text content
 * @param {number} containerWidth - Available width
 * @description This is used only during initial rendering and when manually requested
 */
function adjustFontSize(element, text, containerWidth) {
    const optimalSize = calculateOptimalFontSize(text, containerWidth, 
        "Consolas, 'Courier New', Courier, monospace");
    element.style.fontSize = `${optimalSize}px`;
}

/**
 * Calculates optimal height for container based on content
 * @param {HTMLElement} preElement - The pre element containing the content
 * @param {string} text - The text content
 * @returns {number} - Optimal height in pixels
 */
function calculateOptimalHeight(preElement, text) {
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
    const maxHeight = window.innerHeight * 0.7; // 70vh
    
    return Math.min(maxHeight, Math.max(minHeight, totalHeight));
}

/**
 * Adjusts container height based on content
 * @param {HTMLElement} container - The container to adjust
 * @param {HTMLElement} preElement - The pre element with content
 * @param {string} text - The text content
 */
function adjustContainerHeight(container, preElement, text) {
    // In flex layout, we don't need to explicitly set height
    // The container will automatically fill available space
    // We can adjust other properties if needed
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('input').value = e.target.result;
    };
    reader.readAsText(file);
}

WebAssembly.instantiateStreaming(fetch("rendertree.wasm"), go.importObject).then((result) => {
    go.run(result.instance);
});

const PREDICATE_MARKER = "*";

function createTableRow(table, node, index) {
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

function table(input, mode) {
    // unmarshal JSON
    const renderedNodes = JSON.parse(input);
    const placeholder = window.document.getElementById("placeholder");
    placeholder.innerHTML = "";

    const table = document.createElement('table');

    renderedNodes.forEach((node, i) => {
        createTableRow(table, node, i);
    });
    placeholder.appendChild(table);
}

function copyToClipboard(text) {
    // Copy text to clipboard using the Clipboard API
    navigator.clipboard.writeText(text)
        .then(() => {
            console.log('Text copied to clipboard');
            return true;
        })
        .catch(err => {
            console.error('Failed to copy text to clipboard:', err);
            return false;
        });
}

function ascii(input, mode) {
    const result = renderASCII(input, mode);

    const placeholder = window.document.getElementById("placeholder");
    placeholder.innerHTML = "";

    // Create pre container for positioning
    const preContainer = document.createElement('div');
    preContainer.className = 'pre-container';
    preContainer.id = 'pre-container';

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
    
    // Copy button click event handler
    copyButton.addEventListener('click', function() {
        if (copyToClipboard(code.innerText)) {
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
    
    // Adjust font size and container height after elements are in the DOM
    setTimeout(() => {
        // Get available width (container width minus padding)
        const containerWidth = preContainer.clientWidth - 20; // 20px for padding
        adjustFontSize(code, result, containerWidth);
        
        // Adjust container height based on content
        adjustContainerHeight(preContainer, pre, result);
        
        // No window resize handler - adjustments are made only once initially
    }, 0);
}

// Function to execute rendering based on selected method and mode
function renderSelected() {
    const input = document.getElementById("input").value;
    const renderType = document.getElementById("renderType").value;
    const renderMode = document.getElementById("renderMode").value;
    
    if (renderType === "table") {
        table(render(input, renderMode), renderMode);
    } else if (renderType === "ascii") {
        ascii(input, renderMode);
    }
    
    // Setup font size control buttons after rendering
    setTimeout(setupFontSizeControls, 100);
}

// Setup font size and height control buttons
function setupFontSizeControls() {
    const codeElement = document.getElementById('result-code');
    const preContainer = document.getElementById('pre-container');
    
    if (!codeElement || !preContainer) return;
    
    // Font size controls
    // Decrease font size button
    const decreaseBtn = document.getElementById('decrease-font');
    if (decreaseBtn) {
        decreaseBtn.onclick = function() {
            const currentSize = parseInt(getComputedStyle(codeElement).fontSize);
            codeElement.style.fontSize = `${Math.max(MIN_FONT_SIZE, currentSize - 1)}px`;
        };
    }
    
    // Auto-adjust font size button
    const autoBtn = document.getElementById('auto-font');
    if (autoBtn) {
        autoBtn.onclick = function() {
            const containerWidth = preContainer.clientWidth - 20;
            adjustFontSize(codeElement, codeElement.innerText, containerWidth);
        };
    }
    
    // Increase font size button
    const increaseBtn = document.getElementById('increase-font');
    if (increaseBtn) {
        increaseBtn.onclick = function() {
            const currentSize = parseInt(getComputedStyle(codeElement).fontSize);
            codeElement.style.fontSize = `${currentSize + 1}px`;
        };
    }
    
    // Height controls
    // Decrease height button
    const decreaseHeightBtn = document.getElementById('decrease-height');
    if (decreaseHeightBtn) {
        decreaseHeightBtn.onclick = function() {
            const currentHeight = parseInt(getComputedStyle(preContainer).height);
            preContainer.style.height = `${Math.max(MIN_CONTAINER_HEIGHT, currentHeight - 50)}px`;
        };
    }
    
    // Auto-fit height button
    const resetHeightBtn = document.getElementById('reset-height');
    if (resetHeightBtn) {
        resetHeightBtn.onclick = function() {
            // In flex layout, just reset any manual height that might have been set
            preContainer.style.height = "";
            
            // Focus on the output area
            const pre = document.getElementById('result-pre');
            if (pre) {
                pre.scrollIntoView({ behavior: 'smooth' });
            }
        };
    }
    
    // Increase height button
    const increaseHeightBtn = document.getElementById('increase-height');
    if (increaseHeightBtn) {
        increaseHeightBtn.onclick = function() {
            const currentHeight = parseInt(getComputedStyle(preContainer).height);
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
    
    // Setup initial controls
    setupFontSizeControls();
});

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"syscall/js"

	queryplan "github.com/apstndb/spannerplan"
	"github.com/apstndb/spannerplan/plantree/reference"
)


type params struct {
	Input     string `json:"input"`
	Mode      string `json:"mode"`
	Format    string `json:"format"`
	WrapWidth int    `json:"wrapWidth"`
}

// Response represents the structured response from WASM
type Response struct {
	Success bool   `json:"success"`
	Result  string `json:"result,omitempty"`
	Error   *Error `json:"error,omitempty"`
}

// Error represents detailed error information
type Error struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Error types for better error handling
const (
	ErrorTypeParseError           = "PARSE_ERROR"
	ErrorTypeInvalidSpannerFormat = "INVALID_SPANNER_FORMAT"
	ErrorTypeRenderError          = "RENDER_ERROR"
	ErrorTypeInvalidParameters    = "INVALID_PARAMETERS"
)

// Custom error types for better classification
// These correspond to WasmErrorType constants in TypeScript

// ParseError represents JSON/YAML parsing failures
type ParseError struct {
	msg string
}

func (e ParseError) Error() string {
	return e.msg
}

// InvalidSpannerFormatError represents invalid Spanner query plan format or structure
type InvalidSpannerFormatError struct {
	msg string
}

func (e InvalidSpannerFormatError) Error() string {
	return e.msg
}

// RenderError represents general rendering failures
type RenderError struct {
	msg string
}

func (e RenderError) Error() string {
	return e.msg
}

// InvalidParametersError represents invalid function parameters
type InvalidParametersError struct {
	msg string
}

func (e InvalidParametersError) Error() string {
	return e.msg
}

// renderASCII is the main WASM function exposed to JavaScript
// It takes JSON string parameters and returns structured JSON responses
// instead of throwing JavaScript errors directly
func renderASCII(_ js.Value, args []js.Value) any {
	// Helper function to return structured error response
	errorResponse := func(errorType, message, details string) string {
		resp := Response{
			Success: false,
			Error: &Error{
				Type:    errorType,
				Message: message,
				Details: details,
			},
		}
		jsonBytes, _ := json.Marshal(resp)
		return string(jsonBytes)
	}

	// Helper function to return structured success response
	successResponse := func(result string) string {
		resp := Response{
			Success: true,
			Result:  result,
		}
		jsonBytes, _ := json.Marshal(resp)
		return string(jsonBytes)
	}

	if len(args) != 1 {
		return errorResponse(ErrorTypeInvalidParameters, 
			"Invalid number of arguments", 
			fmt.Sprintf("Expected 1 argument, got %d", len(args)))
	}

	par := params{}
	if err := json.Unmarshal([]byte(args[0].String()), &par); err != nil {
		return errorResponse(ErrorTypeParseError, 
			"Failed to parse parameters", 
			err.Error())
	}

	s, err := renderASCIIImpl(par.Input, par.Mode, par.Format, par.WrapWidth)
	if err != nil {
		// Classify error types using errors.As for type-safe error handling
		errorType := classifyError(err)
		return errorResponse(errorType, err.Error(), "")
	}
	
	return successResponse(s)
}

// classifyError determines the error type using errors.As for type-safe classification
func classifyError(err error) string {
	// Check for custom error types first
	var parseErr ParseError
	if errors.As(err, &parseErr) {
		return ErrorTypeParseError
	}
	
	var spannerErr InvalidSpannerFormatError
	if errors.As(err, &spannerErr) {
		return ErrorTypeInvalidSpannerFormat
	}
	
	var renderErr RenderError
	if errors.As(err, &renderErr) {
		return ErrorTypeRenderError
	}
	
	var paramErr InvalidParametersError
	if errors.As(err, &paramErr) {
		return ErrorTypeInvalidParameters
	}
	
	// Default to render error for unknown error types
	return ErrorTypeRenderError
}

// renderASCIIImpl implements the core rendering logic
// Validates parameters, extracts query plan, and renders ASCII output
func renderASCIIImpl(j string, modeStr string, formatStr string, wrapWidth int) (string, error) {
	stats, _, err := queryplan.ExtractQueryPlan([]byte(j))
	if err != nil {
		// Wrap external parsing errors in our custom type
		return "", ParseError{msg: fmt.Sprintf("Failed to extract query plan: %v", err)}
	}

	mode, err := reference.ParseRenderMode(modeStr)
	if err != nil {
		return "", InvalidParametersError{msg: fmt.Sprintf("Invalid render mode: %v", err)}
	}

	format, err := reference.ParseFormat(formatStr)
	if err != nil {
		return "", InvalidParametersError{msg: fmt.Sprintf("Invalid format type: %v", err)}
	}

	// Validate Spanner query plan structure
	queryPlan := stats.GetQueryPlan()
	if queryPlan == nil {
		return "", InvalidSpannerFormatError{msg: "Query plan is missing from input"}
	}
	
	planNodes := queryPlan.GetPlanNodes()
	if len(planNodes) == 0 {
		return "", InvalidSpannerFormatError{msg: "Plan nodes are missing from query plan"}
	}

	s, err := reference.RenderTreeTable(planNodes, mode, format, wrapWidth)
	if err != nil {
		return "", RenderError{msg: fmt.Sprintf("Failed to render tree table: %v", err)}
	}
	return s, nil
}


func main() {
	js.Global().Set("renderASCII", js.FuncOf(renderASCII))
	c := make(<-chan struct{})
	<-c
}

//go:build js && wasm

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"syscall/js"

	queryplan "github.com/apstndb/spannerplan"
	"github.com/apstndb/spannerplan/plantree/reference"
	"github.com/apstndb/spannerplanviz/mermaid"
	"github.com/apstndb/spannerplanviz/visualize"
)

type params struct {
	Input                      string                   `json:"input"`
	Mode                       string                   `json:"mode"`
	Format                     string                   `json:"format"`
	WrapWidth                  int                      `json:"wrapWidth"`
	HangingIndent              bool                     `json:"hangingIndent"`
	PrintSections              *reference.PrintSections `json:"printSections,omitempty"`
	ShowScalarVars             bool                     `json:"showScalarVars,omitempty"`
	ResolveScalarVars          bool                     `json:"resolveScalarVars,omitempty"`
	ResolveScalarVarsRecursive bool                     `json:"resolveScalarVarsRecursive,omitempty"`
}

type mermaidParams struct {
	Input             string `json:"input"`
	Full              bool   `json:"full"`
	Metadata          bool   `json:"metadata,omitempty"`
	ExecutionStats    bool   `json:"executionStats,omitempty"`
	ExecutionSummary  bool   `json:"executionSummary,omitempty"`
	SerializeResult   bool   `json:"serializeResult,omitempty"`
	HideScanTarget    bool   `json:"hideScanTarget,omitempty"`
	NonVariableScalar bool   `json:"nonVariableScalar,omitempty"`
	VariableScalar    bool   `json:"variableScalar,omitempty"`
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

func errorResponse(errorType, message, details string) string {
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

func successResponse(result string) string {
	resp := Response{
		Success: true,
		Result:  result,
	}
	jsonBytes, _ := json.Marshal(resp)
	return string(jsonBytes)
}

func invokeWasm(args []js.Value, run func(string) (string, error)) any {
	if len(args) != 1 {
		return errorResponse(ErrorTypeInvalidParameters,
			"Invalid number of arguments",
			fmt.Sprintf("Expected 1 argument, got %d", len(args)))
	}

	result, err := run(args[0].String())
	if err != nil {
		return errorResponse(classifyError(err), err.Error(), "")
	}
	return successResponse(result)
}

// renderASCII is the main WASM function exposed to JavaScript
// It takes JSON string parameters and returns structured JSON responses
// instead of throwing JavaScript errors directly
func renderASCII(_ js.Value, args []js.Value) any {
	return invokeWasm(args, func(paramsJSON string) (string, error) {
		par := params{}
		if err := json.Unmarshal([]byte(paramsJSON), &par); err != nil {
			return "", ParseError{msg: fmt.Sprintf("Failed to parse parameters: %v", err)}
		}
		return renderASCIIImpl(par)
	})
}

func renderMermaid(_ js.Value, args []js.Value) any {
	return invokeWasm(args, func(paramsJSON string) (string, error) {
		par := mermaidParams{}
		if err := json.Unmarshal([]byte(paramsJSON), &par); err != nil {
			return "", ParseError{msg: fmt.Sprintf("Failed to parse parameters: %v", err)}
		}
		return renderMermaidImpl(par)
	})
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
func renderASCIIImpl(par params) (string, error) {
	stats, _, err := queryplan.ExtractQueryPlan([]byte(par.Input))
	if err != nil {
		// Wrap external parsing errors in our custom type
		return "", ParseError{msg: fmt.Sprintf("Failed to extract query plan: %v", err)}
	}

	mode, err := reference.ParseRenderMode(par.Mode)
	if err != nil {
		return "", InvalidParametersError{msg: fmt.Sprintf("Invalid render mode: %v", err)}
	}

	format, err := reference.ParseFormat(par.Format)
	if err != nil {
		return "", InvalidParametersError{msg: fmt.Sprintf("Invalid format type: %v", err)}
	}

	if par.PrintSections != nil {
		for _, section := range *par.PrintSections {
			if _, err := reference.ParsePrintSection(string(section)); err != nil {
				return "", InvalidParametersError{msg: fmt.Sprintf("Invalid print section: %v", err)}
			}
		}
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

	config := reference.RenderConfig{
		WrapWidth:                  par.WrapWidth,
		HangingIndent:              par.HangingIndent,
		PrintSections:              par.PrintSections,
		ShowScalarVars:             par.ShowScalarVars,
		ResolveScalarVars:          par.ResolveScalarVars,
		ResolveScalarVarsRecursive: par.ResolveScalarVarsRecursive,
	}
	s, err := reference.RenderTreeTableWithConfig(planNodes, mode, format, config)
	if err != nil {
		return "", RenderError{msg: fmt.Sprintf("Failed to render tree table: %v", err)}
	}
	return s, nil
}

func renderMermaidImpl(par mermaidParams) (string, error) {
	stats, rowType, err := queryplan.ExtractQueryPlan([]byte(par.Input))
	if err != nil {
		return "", ParseError{msg: fmt.Sprintf("Failed to extract query plan: %v", err)}
	}

	queryPlan := stats.GetQueryPlan()
	if queryPlan == nil {
		return "", InvalidSpannerFormatError{msg: "Query plan is missing from input"}
	}
	if len(queryPlan.GetPlanNodes()) == 0 {
		return "", InvalidSpannerFormatError{msg: "Plan nodes are missing from query plan"}
	}

	buildOpts := visualize.BuildOptions{
		Full:              par.Full,
		Metadata:          par.Metadata,
		ExecutionStats:    par.ExecutionStats,
		ExecutionSummary:  par.ExecutionSummary,
		SerializeResult:   par.SerializeResult,
		HideScanTarget:    par.HideScanTarget,
		NonVariableScalar: par.NonVariableScalar,
		VariableScalar:    par.VariableScalar,
	}
	buildOpts.ApplyFull()

	plan, err := visualize.BuildPlan(rowType, stats, buildOpts)
	if err != nil {
		return "", RenderError{msg: fmt.Sprintf("Failed to build plan: %v", err)}
	}

	src, err := mermaid.Source(plan)
	if err != nil {
		return "", RenderError{msg: fmt.Sprintf("Failed to render mermaid diagram: %v", err)}
	}
	return src, nil
}

func main() {
	js.Global().Set("renderASCII", js.FuncOf(renderASCII))
	js.Global().Set("renderMermaid", js.FuncOf(renderMermaid))
	c := make(<-chan struct{})
	<-c
}

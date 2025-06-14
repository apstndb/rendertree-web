package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strings"
	"syscall/js"

	sppb "cloud.google.com/go/spanner/apiv1/spannerpb"
	"github.com/apstndb/lox"
	queryplan "github.com/apstndb/spannerplan"
	"github.com/apstndb/spannerplan/plantree"
	"github.com/mattn/go-runewidth"
	"github.com/olekukonko/tablewriter"
	"github.com/olekukonko/tablewriter/renderer"
	"github.com/olekukonko/tablewriter/tw"
	"github.com/samber/lo"
)

type RenderMode string

const (
	RenderModeAuto    RenderMode = "AUTO"
	RenderModePlan    RenderMode = "PLAN"
	RenderModeProfile RenderMode = "PROFILE"
)

func ParseRenderMode(s string) (RenderMode, error) {
	switch strings.ToUpper(s) {
	case "AUTO":
		return RenderModeAuto, nil
	case "PLAN":
		return RenderModePlan, nil
	case "PROFILE":
		return RenderModeProfile, nil
	default:
		return "", fmt.Errorf("unknown render mode: %s", s)
	}
}

func RenderTreeTable(planNodes []*sppb.PlanNode, mode RenderMode, format Format, wrapWidth int) (string, error) {
	var withStats bool
	switch mode {
	case RenderModeAuto:
		withStats = queryplan.HasStats(planNodes)
	case RenderModePlan:
		withStats = false
	case RenderModeProfile:
		withStats = true
	default:
		return "", fmt.Errorf("unknown render mode: %s", mode)
	}

	rendered, err := ProcessTree(planNodes, format, wrapWidth)
	if err != nil {
		return "", err
	}

	tablePart, err := renderTablePart(rendered, withStats)
	if err != nil {
		return "", err
	}

	predPart, err := renderPredicatesPart(rendered)
	if err != nil {
		return "", err
	}

	return tablePart + predPart, nil

}

func renderPredicatesPart(rendered []plantree.RowWithPredicates) (string, error) {
	maxIDLength := len(fmt.Sprint(lo.LastOr(rendered, plantree.RowWithPredicates{}).ID))

	var predicates []string
	for _, row := range rendered {
		for i, predicate := range row.Predicates {
			prefix := runewidth.FillLeft(lox.IfOrEmpty(i == 0, fmt.Sprint(row.ID)+":"), maxIDLength+1)
			predicates = append(predicates, fmt.Sprintf("%s %s", prefix, predicate))
		}
	}

	var sb strings.Builder
	if len(predicates) > 0 {
		fmt.Fprintln(&sb, "Predicates(identified by ID):")
		for _, s := range predicates {
			fmt.Fprintln(&sb, " "+s)
		}
	}
	return sb.String(), nil
}

func renderTablePart(rendered []plantree.RowWithPredicates, withStats bool, ) (string, error) {
	var sb strings.Builder
	table := tablewriter.NewTable(&sb,
		tablewriter.WithRenderer(
			renderer.NewBlueprint(tw.Rendition{Symbols: tw.NewSymbols(tw.StyleASCII)}),
		),
		tablewriter.WithTrimSpace(tw.Off),
		tablewriter.WithHeaderAutoFormat(tw.Off),
		tablewriter.WithHeaderAlignment(tw.AlignLeft),
	)
	table.Configure(func(config *tablewriter.Config) {
		config.Header.Formatting.AutoFormat = tw.Off
		config.Row.ColumnAligns = []tw.Align{tw.AlignRight, tw.AlignLeft}
	})

	header := []string{"ID", "Operator"}
	if withStats {
		header = append(header, "Rows", "Exec.", "Total Latency")
	}
	table.Header(header)

	for _, n := range rendered {
		rowData := []string{n.FormatID(), n.Text()}
		if withStats {
			rowData = append(rowData, n.ExecutionStats.Rows.Total, n.ExecutionStats.ExecutionSummary.NumExecutions, n.ExecutionStats.Latency.String())
		}

		if err := table.Append(rowData); err != nil {
			return "", err
		}
	}

	if err := table.Render(); err != nil {
		return "", err
	}
	return sb.String(), nil
}

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
func renderASCII(this js.Value, args []js.Value) any {
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
	
	// Fallback to string-based classification for external errors
	errMsg := err.Error()
	
	// Check for Spanner-specific format errors
	if strings.Contains(errMsg, "query_plan") || 
	   strings.Contains(errMsg, "execution_stats") ||
	   strings.Contains(errMsg, "plan_node") {
		return ErrorTypeInvalidSpannerFormat
	}
	
	// Check for JSON/YAML parsing errors
	if strings.Contains(errMsg, "json") || 
	   strings.Contains(errMsg, "yaml") ||
	   strings.Contains(errMsg, "unmarshal") ||
	   strings.Contains(errMsg, "parse") {
		return ErrorTypeParseError
	}
	
	// Check for parameter validation errors
	if strings.Contains(errMsg, "unknown render mode") ||
	   strings.Contains(errMsg, "unknown Format") {
		return ErrorTypeInvalidParameters
	}
	
	// Default to render error for other cases
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

	mode, err := ParseRenderMode(modeStr)
	if err != nil {
		return "", InvalidParametersError{msg: fmt.Sprintf("Invalid render mode: %v", err)}
	}

	format, err := ParseFormat(formatStr)
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

	s, err := RenderTreeTable(planNodes, mode, format, wrapWidth)
	if err != nil {
		return "", RenderError{msg: fmt.Sprintf("Failed to render tree table: %v", err)}
	}
	return s, nil
}

type Format string

const (
	formatTraditional Format = "TRADITIONAL"
	formatCurrent     Format = "CURRENT"
	formatCompact     Format = "COMPACT"
)

func ParseFormat(str string) (Format, error) {
	switch strings.ToUpper(str) {
	case "TRADITIONAL":
		return formatTraditional, nil
	case "CURRENT":
		return formatCurrent, nil
	case "COMPACT":
		return formatCompact, nil
	default:
		return "", fmt.Errorf("unknown Format: %s", str)
	}

}

func ProcessTree(planNodes []*sppb.PlanNode, format Format, wrapWidth int) ([]plantree.RowWithPredicates, error) {
	qp, err := queryplan.New(planNodes)
	if err != nil {
		return nil, err
	}

	var opts []plantree.Option
	opts = append(opts, optsForFormat(format)...)

	if wrapWidth > 0 {
		opts = append(opts, plantree.WithWrapWidth(wrapWidth))
	}

	return plantree.ProcessPlan(qp, opts...)
}

func optsForFormat(format Format) []plantree.Option {
	currentOpts := []plantree.Option{
		plantree.WithQueryPlanOptions(
			queryplan.WithKnownFlagFormat(queryplan.KnownFlagFormatLabel),
			queryplan.WithExecutionMethodFormat(queryplan.ExecutionMethodFormatAngle),
			queryplan.WithTargetMetadataFormat(queryplan.TargetMetadataFormatOn),
		),
	}

	switch format {
	case formatTraditional:
		return nil
	case formatCurrent:
		return currentOpts
	case formatCompact:
		return slices.Concat(currentOpts,
			[]plantree.Option{plantree.EnableCompact()})
	default:
		return nil
	}
}

func main() {
	js.Global().Set("renderASCII", js.FuncOf(renderASCII))
	c := make(<-chan struct{})
	<-c
}

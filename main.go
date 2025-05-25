package main

import (
	"fmt"
	"strconv"
	"strings"
	"syscall/js"

	sppb "cloud.google.com/go/spanner/apiv1/spannerpb"
	"github.com/apstndb/lox"
	"github.com/apstndb/spannerplanviz/plantree"
	"github.com/apstndb/spannerplanviz/queryplan"
	"github.com/mattn/go-runewidth"
	"github.com/olekukonko/tablewriter"
	"github.com/olekukonko/tablewriter/renderer"
	"github.com/olekukonko/tablewriter/tw"
	"github.com/samber/lo"
)

func referenceRenderTreeTable(planNodes []*sppb.PlanNode, withStats bool) (string, error) {
	rendered, err := referenceRenderTree(planNodes)
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
		rowData := []string{
			lox.IfOrEmpty(len(n.Predicates) > 0, "*") + strconv.Itoa(int(n.ID)),
			n.TreePart + n.NodeText}
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

func detectHasStats(nodes []*sppb.PlanNode) bool {
	switch {
	case len(nodes) == 0:
		return false
	case nodes[0].ExecutionStats != nil:
		return true
	default:
		return false
	}
}
func renderASCII(this js.Value, args []js.Value) any {
	stats, _, err := queryplan.ExtractQueryPlan([]byte(args[0].String()))
	if err != nil {
		return err.Error()
	}

	var withStats bool
	switch mode := args[1].String(); strings.ToUpper(mode) {
	case "AUTO":
		withStats = detectHasStats(stats.GetQueryPlan().GetPlanNodes())
	case "PLAN":
		withStats = false
	case "PROFILE":
		withStats = true
	default:
		return "unknown mode"
	}

	stats.GetQueryPlan().GetPlanNodes()

	s, err := referenceRenderTreeTable(stats.GetQueryPlan().GetPlanNodes(), withStats)
	if err != nil {
		return err.Error()
	}
	return s
}

func referenceRenderTree(planNodes []*sppb.PlanNode) ([]plantree.RowWithPredicates, error) {
	qp := queryplan.New(planNodes)
	return plantree.ProcessPlan(qp,
		plantree.WithQueryPlanOptions(
			queryplan.WithFullScanFormat(queryplan.FullScanFormatLabel),
			queryplan.WithExecutionMethodFormat(queryplan.ExecutionMethodFormatAngle),
			queryplan.WithTargetMetadataFormat(queryplan.TargetMetadataFormatOn),
		))
}

func main() {
	js.Global().Set("renderASCII", js.FuncOf(renderASCII))
	c := make(<-chan struct{}, 0)
	<-c
}

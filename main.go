package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"syscall/js"

	sppb "cloud.google.com/go/spanner/apiv1/spannerpb"
	"github.com/apstndb/spannerplanviz/plantree"
	"github.com/apstndb/spannerplanviz/queryplan"
	"github.com/olekukonko/tablewriter"
	"github.com/olekukonko/tablewriter/renderer"
	"github.com/olekukonko/tablewriter/tw"
	"github.com/samber/lo"
)

func Render(this js.Value, args []js.Value) any {
	rendered, err := renderTree([]byte(args[0].String()))
	if err != nil {
		return err.Error()
	}

	j, err := json.Marshal(rendered)
	if err != nil {
		return err.Error()
	}
	return string(j)
}

func referenceRenderTreeTable(planNodes []*sppb.PlanNode) (string, error) {
	rendered, err := referenceRenderTree(planNodes)
	if err != nil {
		return "", err
	}

	var sb strings.Builder
	table := tablewriter.NewTable(&sb,
		tablewriter.WithRenderer(
			renderer.NewBlueprint(tw.Rendition{Symbols: tw.NewSymbols(tw.StyleASCII)}),
		),
		tablewriter.WithHeaderAutoFormat(tw.Off),
		tablewriter.WithHeaderAlignment(tw.AlignLeft),
	)
	table.Configure(func(config *tablewriter.Config) {
		config.Header.Formatting.AutoFormat = tw.Off
		config.Row.ColumnAligns = []tw.Align{tw.AlignRight, tw.AlignLeft}
	})
	table.Header("ID", "Operators")
	for _, n := range rendered {
		hasPred := len(n.Predicates) > 0
		err := table.Append([]string{
			lo.Ternary(hasPred, "*", "") + strconv.Itoa(int(n.ID)),
			n.TreePart + n.NodeText})
		if err != nil {
			return "", err
		}
	}
	if err := table.Render(); err != nil {
		return "", err
	}

	maxIDLength := len(fmt.Sprint(lo.LastOr(rendered, plantree.RowWithPredicates{}).ID))

	var predicates []string
	for _, row := range rendered {
		var prefix string
		for i, predicate := range row.Predicates {
			if i == 0 {
				prefix = fmt.Sprintf("%*d:", maxIDLength, row.ID)
			} else {
				prefix = strings.Repeat(" ", maxIDLength+1)
			}
			predicates = append(predicates, fmt.Sprintf("%s %s", prefix, predicate))
		}
	}

	if len(predicates) > 0 {
		fmt.Fprintln(&sb, "Predicates(identified by ID):")
		for _, s := range predicates {
			fmt.Fprintf(&sb, " %s\n", s)
		}
	}

	return sb.String(), nil
}

func RenderASCII(this js.Value, args []js.Value) any {
	stats, _, err := queryplan.ExtractQueryPlan([]byte(args[0].String()))
	if err != nil {
		return err.Error()
	}

	s, err := referenceRenderTreeTable(stats.GetQueryPlan().GetPlanNodes())
	if err != nil {
		return err.Error()
	}
	return s
}

func renderTree(b []byte) ([]plantree.RowWithPredicates, error) {
	stats, _, err := queryplan.ExtractQueryPlan(b)
	if err != nil {
		return nil, err
	}

	return referenceRenderTree(stats.GetQueryPlan().GetPlanNodes())
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
	js.Global().Set("render", js.FuncOf(Render))
	js.Global().Set("renderASCII", js.FuncOf(RenderASCII))
	c := make(<-chan struct{}, 0)
	<-c
}

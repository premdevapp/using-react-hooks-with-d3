import React, { useRef, useEffect } from "react";
import { select, hierarchy, tree, linkHorizontal } from "d3";
import useResizeObserver from "./useResizeObserver";

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function TreeChart({ data }) {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const previouslyRenderedData = usePrevious(dimensions ? data : null);

  // will be called initially and on every data change
  useEffect(() => {
    const svg = select(svgRef.current);
    if (!dimensions) return;

    // transform hierachical data
    const root = hierarchy(data);
    const treeLayout = tree().size([dimensions.height, dimensions.width]);

    const linkGenerator = linkHorizontal()
      .x(link => link.y)
      .y(link => link.x);

    // enrich hiearchy data with coordinates
    treeLayout(root);

    console.warn("descendants", root.descendants());
    console.warn("links", root.links());

    // nodes
    svg
      .selectAll(".node")
      .data(root.descendants())
      .join(enter => enter.append("circle").attr("opacity", 0))
      .classed("node", true)
      .attr("cx", node => node.y)
      .attr("cy", node => node.x)
      .attr("r", 4)
      .transition()
      .duration(500)
      .delay(node => node.depth * 300)
      .attr("opacity", 1);

    // links
    const enteringAndUpdatingLinks = svg
      .selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("d", linkGenerator)
      .attr("stroke-dasharray", function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr("stroke", "black")
      .attr("fill", "none")
      .classed("link", true)
      .attr("opacity", 1);

    if (data !== previouslyRenderedData) {
      enteringAndUpdatingLinks
        .attr("stroke-dashoffset", function() {
          return this.getTotalLength();
        })
        .transition()
        .duration(500)
        .delay(link => link.source.depth * 500)
        .attr("stroke-dashoffset", 0);
    }

    // labels
    svg
      .selectAll(".label")
      .data(root.descendants())
      .join(enter => enter.append("text").attr("opacity", 0))
      .classed("label", true)
      .attr("x", node => node.y)
      .attr("y", node => node.x - 12)
      .attr("text-anchor", "middle")
      .attr("font-size", 24)
      .text(node => node.data.name)
      .transition()
      .duration(500)
      .delay(node => node.depth * 300)
      .attr("opacity", 1);
  }, [data, dimensions, previouslyRenderedData]);

  return (
    <div ref={wrapperRef} style={{ marginBottom: "2rem" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default TreeChart;

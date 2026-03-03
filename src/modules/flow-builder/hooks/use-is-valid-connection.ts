import type { Connection, Edge, Node } from '@xyflow/react'
import { getOutgoers } from '@xyflow/react'
import { useCallback } from 'react'

import { NODES_METADATA } from '~/modules/nodes'

function findTargetNode(nodes: Node[], connection: Edge | Connection) {
  return nodes.find(node => node.id === connection.target)
}

function findSourceNode(nodes: Node[], connection: Edge | Connection) {
  return nodes.find(node => node.id === connection.source)
}

function hasCycle(node: Node, connection: Edge | Connection, nodes: Node[], edges: Edge[], visited: Set<string> = new Set<string>()) {
  if (visited.has(node.id)) { return false }

  visited.add(node.id)

  for (const outgoer of getOutgoers(node, nodes, edges)) {
    if (outgoer.id === connection.source) { return true }
    if (hasCycle(outgoer, connection, nodes, edges, visited)) { return true }
  }
}

export function useIsValidConnection(nodes: Node[], edges: Edge[]) {
  return useCallback(
    (connection: Edge | Connection) => {
      const sourceNode = findSourceNode(nodes, connection)
      const targetNode = findTargetNode(nodes, connection)

      if (targetNode?.id === connection.source) { return false }

      // Check connection limits
      if (sourceNode) {
        const sourceMeta = NODES_METADATA[sourceNode.type as keyof typeof NODES_METADATA]
        if (sourceMeta) {
          const currentOutputs = edges.filter(e => e.source === connection.source).length
          if (currentOutputs >= sourceMeta.connection.outputs) { return false }
        }
      }

      if (targetNode) {
        const targetMeta = NODES_METADATA[targetNode.type as keyof typeof NODES_METADATA]
        if (targetMeta) {
          const currentInputs = edges.filter(e => e.target === connection.target).length
          if (currentInputs >= targetMeta.connection.inputs) { return false }
        }
      }

      return targetNode ? !hasCycle(targetNode, connection, nodes, edges) : true
    },
    [nodes, edges],
  )
}

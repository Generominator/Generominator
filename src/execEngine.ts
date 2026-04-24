import {
    type Card,
    type CardEventCallback,
    isEventEmitting,
    isOutputRoutableCard,
} from "./cardBase/card"
import { type DataType, type DataTypeName } from "./cardBase/dataTypes"
import {
    type BindableDataTypeName,
    isBindablePort,
} from "./cardBase/ports/port"

export type NodeId = string
type ConcreteType = BindableDataTypeName

const isConcreteType = (type: DataTypeName): type is ConcreteType =>
    type !== "generic"

/** Internal runtime node shape */
export interface Node {
    id: NodeId
    card: Card
    defaultInputs: Array<DataType | null>
    pos: [number, number]
}

/** Edge connects one node's output index to another node's input index */
export interface Edge {
    from: NodeId // source node id
    outIdx: number // output port index on source node
    to: NodeId // target node id
    inIdx: number // input port index on target node
}

/**
 * A proof-of-concept execution graph for Cards.
 *
 * functions::
 * - addNode(card): register a card and get an id
 * - connect(from, outIdx, to, inIdx): create a port->port connection
 * - run(initialInputs): asynchronously execute all nodes in topological order, awaiting each card
 * - subscribeToEvents(callback): register for card event notifications
 * - runFromNode(nodeId): re-run only the specified node and its downstream dependencies
 */
export class ExecutionGraph {
    // Map of node id -> Node (holds the Card instance)
    nodes = new Map<NodeId, Node>()
    // Simple list of edges
    edges: Edge[] = []
    private counter = 0 // used to generate unique node ids

    // Cached outputs from the last run, used for incremental re-evaluation
    private cachedOutputs = new Map<NodeId, DataType[]>()

    // Event listeners for card events
    private readonly eventListeners: Set<CardEventCallback> = new Set()

    // Results listeners - get notified with updated outputs whenever the graph runs
    private readonly resultsListeners: Set<
        (results: Map<NodeId, DataType[]>) => void
    > = new Set()

    // Queue for serializing run executions to prevent race conditions
    private runQueue: Promise<Map<NodeId, DataType[]>> = Promise.resolve(
        new Map(),
    )

    // Pending run request for merging rapid events (when merging is enabled)
    private pendingRun: {
        initialInputs?: Map<NodeId, DataType[]>
        nodesToRun: Set<NodeId>
        waiters: Array<{
            resolve: (value: Map<NodeId, DataType[]>) => void
            reject: (reason: unknown) => void
        }>
    } | null = null

    // Whether a run is currently executing
    private isRunning = false

    /**
     * Register a Card instance as a node and return its NodeId.
     * Example: const id = graph.addNode(new SomeCard())
     *
     * If the card implements EventEmitting, it will be wired up
     * to trigger re-evaluation when it emits events.
     */
    addNode(card: Card, x = 0, y = 0): NodeId {
        const id = `node_${this.counter++}`
        const defaults = card.inputs.map((input) => input.defaultValue ?? null)
        this.nodes.set(id, { id, card, defaultInputs: defaults, pos: [x, y] })

        // Wire up event-emitting cards to trigger graph events with their node ID
        if (isEventEmitting(card)) {
            card.setEventCallback((changedOutputIndices) => {
                this.handleCardEvent(id, changedOutputIndices)
            })
        }

        return id
    }

    setNode(id: NodeId, props: Partial<Omit<Node, "id" | "card">>) {
        const node = this.nodes.get(id)
        if (!node) return
        const newNode = { ...node, ...props }
        this.nodes.set(id, newNode)
        return newNode
    }

    deleteNode(id: NodeId) {
        //Clean up the card first just in case it has any lingering event listeners or resources
        this.nodes.get(id)?.card.cleanup()
        // Remove the node
        this.nodes.delete(id)
        // Remove connected edges
        this.edges = this.edges.filter((e) => {
            const removed = e.from === id || e.to === id // edge that touch this node
            if (!removed) return true // keep edges that don't touch this node
            return false // drop this edge because it referenced the deleted node
        })
        // Recompute generic bindings after topology change
        this.refreshTypeBindings()
    }

    /**
     * Subscribe to card events. The callback will be invoked whenever
     * any event-emitting card triggers a re-evaluation request.
     *
     * Returns a function to unsubscribe that listener.
     */
    subscribeToEvents(callback: CardEventCallback): () => void {
        this.eventListeners.add(callback)
        return () => {
            this.eventListeners.delete(callback)
        }
    }

    /**
     * Subscribe to results updates. The callback will be invoked with the
     * updated outputs map whenever the graph finishes running.
     *
     * Returns a function to unsubscribe.
     */
    subscribeToResults(
        callback: (results: Map<NodeId, DataType[]>) => void,
    ): () => void {
        this.resultsListeners.add(callback)
        return () => {
            this.resultsListeners.delete(callback)
        }
    }

    /**
     * Handle an event from a card. This notifies all event listeners and
     * automatically re-evaluates the emitting node and its downstream dependencies.
     */
    private handleCardEvent(
        nodeId: NodeId,
        changedOutputIndices?: readonly number[],
    ): void {
        for (const listener of this.eventListeners) {
            listener(changedOutputIndices)
        }
        // Automatically re-evaluate the node that emitted the event and its downstream nodes
        this.runFromNode(nodeId, changedOutputIndices)
    }

    /**
     * Connect an output port of one node to an input port of another using the label of the ports.
     * This version does not validate the connection in any way.
     */
    connect(
        from: NodeId,
        outIdxs: number | string,
        to: NodeId,
        inIdxs: number | string,
    ) {
        if (typeof outIdxs !== typeof inIdxs) {
            return
        }
        let outIdx: number = -1
        let inIdx: number = -1
        if (typeof inIdxs === "string") {
            const outputs = this.nodes.get(from)!.card.outputs
            const inputs = this.nodes.get(to)!.card.inputs
            for (let i = 0; i < outputs.length; i++) {
                if (outputs[i].label === outIdxs) {
                    outIdx = i
                    break
                }
            }
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i].label === inIdxs) {
                    inIdx = i
                    break
                }
            }
        } else {
            outIdx = outIdxs as number
            inIdx = inIdxs as number
        }
        this.edges.push({ from, outIdx, to, inIdx })
        this.refreshTypeBindings()
    }

    //Now we need to handle disconnecting stuff to refresh type bindings and stuff.
    disconnectEdge(index: number): Edge | null {
        if (index < 0 || index >= this.edges.length) {
            return null
        }
        const [removed] = this.edges.splice(index, 1)
        if (!removed) {
            return null
        }
        this.refreshTypeBindings()
        return removed
    }

    /**
     * Infer a concrete type for a port from connected neighbor ports.
     */
    private inferEdgeType(
        nodeId: NodeId,
        direction: "input" | "output",
        index: number,
    ): ConcreteType | null {
        for (const edge of this.edges) {
            if (direction === "input") {
                if (edge.to !== nodeId || edge.inIdx !== index) continue
                const source = this.nodes.get(edge.from)?.card.outputs[
                    edge.outIdx
                ]
                if (source && isConcreteType(source.dataType)) {
                    return source.dataType
                }
            } else {
                if (edge.from !== nodeId || edge.outIdx !== index) continue
                const dest = this.nodes.get(edge.to)?.card.inputs[edge.inIdx]
                if (dest && isConcreteType(dest.dataType)) {
                    return dest.dataType
                }
            }
        }
        return null
    }

    /**
     * Refresh bindable ports for one node.
     * Returns true when any port type changed.
     */
    private refreshNodeTypeBindings(nodeId: NodeId): boolean {
        const node = this.nodes.get(nodeId)
        if (!node) return false

        let changed = false
        let nodeScopedType: ConcreteType | null = null

        for (let i = 0; i < node.card.inputs.length; i++) {
            const port = node.card.inputs[i]
            if (isBindablePort(port) && port.bindingScope === "node") {
                nodeScopedType ??= this.inferEdgeType(nodeId, "input", i)
            }
        }
        for (let i = 0; i < node.card.outputs.length; i++) {
            const port = node.card.outputs[i]
            if (isBindablePort(port) && port.bindingScope === "node") {
                nodeScopedType ??= this.inferEdgeType(nodeId, "output", i)
            }
        }

        for (let i = 0; i < node.card.inputs.length; i++) {
            const port = node.card.inputs[i]
            if (!isBindablePort(port)) continue
            const nextType =
                this.inferEdgeType(nodeId, "input", i) ??
                (port.bindingScope === "node" ? nodeScopedType : null)
            const nextDataType = nextType ?? "generic"
            changed = port.dataType !== nextDataType || changed
            port.bind(nextType)
        }
        for (let i = 0; i < node.card.outputs.length; i++) {
            const port = node.card.outputs[i]
            if (!isBindablePort(port)) continue
            const nextType =
                this.inferEdgeType(nodeId, "output", i) ??
                (port.bindingScope === "node" ? nodeScopedType : null)
            const nextDataType = nextType ?? "generic"
            changed = port.dataType !== nextDataType || changed
            port.bind(nextType)
        }

        return changed
    }

    /**
     * Recompute all generic-port bindings in the graph.
     */
    private refreshTypeBindings(): void {
        for (const node of this.nodes.values()) {
            for (const port of [...node.card.inputs, ...node.card.outputs]) {
                if (isBindablePort(port)) {
                    port.bind(null)
                }
            }
        }

        const maxPasses = Math.max(1, this.nodes.size * 2)
        for (let pass = 0; pass < maxPasses; pass++) {
            let changed = false
            for (const nodeId of this.nodes.keys()) {
                changed = this.refreshNodeTypeBindings(nodeId) || changed
            }
            if (!changed) {
                return
            }
        }
    }

    /**
     * Execute the graph asynchronously, optionally providing initial inputs to any specified nodes.
     * Cards are executed in topological order, waiting for each card to complete before moving on.
     *
     * Concurrent calls to run() are queued to prevent race conditions with the cache.
     * If any card fails, the error propagates and stops all queued executions.
     *
     * If merge is true and a run is already in progress, this request will be merged
     * with any other pending requests and executed once the current run completes.
     *
     * @param initialInputs - Optional map of node IDs to initial input values
     * @param nodesToRun - Optional set of node IDs to run (if omitted, runs all connected nodes)
     * @param merge - If true, merge with pending requests instead of strict queuing (defaults to true)
     */
    async run(
        initialInputs?: Map<NodeId, DataType[]>,
        nodesToRun?: Set<NodeId>,
        merge = true,
    ): Promise<Map<NodeId, DataType[]>> {
        if (merge && this.isRunning) {
            // merge this request with any pending request
            return this.mergeRun(initialInputs, nodesToRun)
        }

        // Queue this execution to run after any pending executions complete
        const queue = this.runQueue.catch(() => new Map())
        this.runQueue = queue.then(() =>
            this.executeRun(initialInputs, nodesToRun),
        )

        return this.runQueue
    }

    /**
     * merge a run request with any pending request.
     * If there's already a pending request, merge the nodesToRun sets.
     * Otherwise, create a new pending request that will execute after the current run.
     */
    private mergeRun(
        initialInputs?: Map<NodeId, DataType[]>,
        nodesToRun?: Set<NodeId>,
    ): Promise<Map<NodeId, DataType[]>> {
        // Default to all connected nodes if not specified
        const nodes = nodesToRun ?? new Set(this.nodes.keys())

        if (this.pendingRun) {
            // Merge with existing pending request
            for (const nodeId of nodes) {
                this.pendingRun.nodesToRun.add(nodeId)
            }
            // Merge initial inputs if provided
            if (initialInputs) {
                this.pendingRun.initialInputs ??= new Map()
                for (const [k, v] of initialInputs) {
                    this.pendingRun.initialInputs.set(k, v)
                }
            }
            // Return a promise that resolves when the pending run completes.
            // Keep a waiter list instead of nesting callbacks on every merge.
            return new Promise((resolve, reject) => {
                this.pendingRun!.waiters.push({ resolve, reject })
            })
        }

        // Create a new pending request
        return new Promise((resolve, reject) => {
            this.pendingRun = {
                initialInputs,
                nodesToRun: nodes,
                waiters: [{ resolve, reject }],
            }
        })
    }

    /**
     * For routing cards, skip nodes that are only reachable through inactive outputs.
     * Shared merge nodes remain active because they're still reachable from an active output.
     */
    private pruneInactiveDownstreamNodes(
        node: Node,
        inputs: DataType[],
        skipped: Set<NodeId>,
        outputs: Map<NodeId, DataType[]>,
    ): void {
        if (!isOutputRoutableCard(node.card)) {
            return
        }

        const activeDownstream = this.getDownstreamNodes(
            node.id,
            new Set(node.card.getActiveOutputIndices(inputs)),
        )

        for (const downstreamNodeId of this.getDownstreamNodes(node.id)) {
            if (
                downstreamNodeId !== node.id &&
                !activeDownstream.has(downstreamNodeId)
            ) {
                skipped.add(downstreamNodeId)
                outputs.delete(downstreamNodeId)
            }
        }
    }

    /**
     * Internal method that actually executes the graph.
     * This should only be called through run() to ensure proper queuing.
     */
    private async executeRun(
        initialInputs?: Map<NodeId, DataType[]>,
        nodesToRun?: Set<NodeId>,
    ): Promise<Map<NodeId, DataType[]>> {
        this.isRunning = true

        try {
            // Start with cached outputs (useful for incremental re-evaluation)
            const outputs = new Map(this.cachedOutputs)

            // Get all of our nodes in topological order so we can execute them correctly.
            let sorted = this.topoSort()

            // If nodesToRun is specified, filter to only those nodes
            if (nodesToRun) {
                sorted = sorted.filter((n) => nodesToRun.has(n.id))
            }

            // Nodes to skip when a routing card deactivates downstream paths.
            const skipped = new Set<NodeId>()

            for (const node of sorted) {
                if (skipped.has(node.id)) {
                    continue
                }

                // Build the inputs array for this node.
                // Start with any provided initial inputs
                const inputs: Array<DataType | null> = [
                    ...(node.defaultInputs ?? []),
                ]
                if (initialInputs?.has(node.id)) {
                    const init = initialInputs.get(node.id)!
                    for (let i = 0; i < init.length; i++) inputs[i] = init[i]
                }

                // Any values from connected edges overwrite initial inputs
                for (const e of this.edges.filter((e) => e.to === node.id)) {
                    const src = outputs.get(e.from)
                    if (src) {
                        const inputPort = node.card.inputs[e.inIdx]
                        const outputValue = src[e.outIdx]
                        // Direct type check: input port expects dataType, outputValue must match
                        if (
                            inputPort.dataType !== "generic" &&
                            outputValue.kind !== inputPort.dataType
                        ) {
                            throw new Error(
                                `Type mismatch: Cannot connect output of node '${e.from}' (type '${outputValue.kind}') to input ${e.inIdx} ('${inputPort.label}') of node '${e.to}' (expects '${inputPort.dataType}')`,
                            )
                        }
                        inputs[e.inIdx] = outputValue
                    }
                }

                // Check for nulls
                if (
                    inputs.some(
                        (v, i) => v === null && !node.card.inputs[i].optional,
                    )
                ) {
                    throw new Error(
                        `Missing input: ${node.card.title} (${node.id}) is missing a required value on input ${inputs.indexOf(null)}.`,
                    )
                }

                // Call the card's evaluate() and store its outputs.
                // Await in case the card returns a Promise (async card).
                // TODO: Update evaluate DataType[] to allow null values
                const result = await node.card.evaluate(inputs as DataType[])
                // Check that the result matches the declared output port types
                if (result.length !== node.card.outputs.length) {
                    throw new Error(
                        `Output length mismatch: ${node.card.title} (${node.id}) returned ${result.length} outputs, but declares ${node.card.outputs.length}`,
                    )
                }
                for (let i = 0; i < result.length; i++) {
                    const expectedType = node.card.outputs[i].dataType
                    if (
                        expectedType !== "generic" &&
                        result[i].kind !== expectedType
                    ) {
                        throw new Error(
                            `Output type mismatch: Card '${node.id}' output ${i} ('${node.card.outputs[i].label}') expected type '${expectedType}', but got '${result[i].kind}'`,
                        )
                    }
                }
                outputs.set(node.id, result)
                this.pruneInactiveDownstreamNodes(
                    node,
                    inputs as DataType[],
                    skipped,
                    outputs,
                )
            }

            // Cache the outputs for incremental re-evaluation
            this.cachedOutputs = new Map(outputs)

            // Notify all results listeners
            for (const listener of this.resultsListeners) {
                listener(outputs)
            }

            return outputs
        } finally {
            this.isRunning = false

            // Check for pending merged runs after finishing
            if (this.pendingRun) {
                const { initialInputs, nodesToRun, waiters } = this.pendingRun
                this.pendingRun = null

                // Queue the merged run
                this.run(initialInputs, nodesToRun)
                    .then((value) => {
                        for (const waiter of waiters) {
                            waiter.resolve(value)
                        }
                    })
                    .catch((reason) => {
                        for (const waiter of waiters) {
                            waiter.reject(reason)
                        }
                    })
            }
        }
    }

    /**
     * Re-run the graph starting from a specific node
     * Uses cached outputs for upstream nodes that don't need re-evaluation.
     *
     * Used for event-driven re-evaluation when a card emits an event, and we only care about updating the subgraph
     *
     * @param startNodeId - The node to start re-evaluation from
     * @param changedOutputIndices - Optional output indices on the start node that changed
     * @returns The updated outputs map (merged with cached values)
     */
    async runFromNode(
        startNodeId: NodeId,
        changedOutputIndices?: readonly number[],
    ): Promise<Map<NodeId, DataType[]>> {
        const changedSet =
            changedOutputIndices && changedOutputIndices.length > 0
                ? new Set(changedOutputIndices)
                : undefined
        const nodesToRun = this.getDownstreamNodes(startNodeId, changedSet)
        return this.run(undefined, nodesToRun)
    }

    /**
     * Get all nodes downstream from (and including) a given node.
     * These are the nodes that would need to be re-evaluated if the given node changes.
     * If changedOutputIndices is provided, traversal from the start node is limited
     * to edges connected to those specific output indices.
     */
    private getDownstreamNodes(
        nodeId: NodeId,
        changedOutputIndices?: ReadonlySet<number>,
    ): Set<NodeId> {
        const downstream = new Set<NodeId>([nodeId])
        const queue: NodeId[] = []

        for (const edge of this.edges) {
            if (
                edge.from === nodeId &&
                (!changedOutputIndices ||
                    changedOutputIndices.has(edge.outIdx)) &&
                !downstream.has(edge.to)
            ) {
                queue.push(edge.to)
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!
            if (downstream.has(current)) continue
            downstream.add(current)

            // Find all nodes that this node feeds into
            for (const edge of this.edges) {
                if (edge.from === current && !downstream.has(edge.to)) {
                    queue.push(edge.to)
                }
            }
        }

        return downstream
    }

    /**
     * Remove event callbacks from all cards. Call this when disposing the graph.
     */
    dispose(): void {
        for (const [, node] of this.nodes) {
            if (isEventEmitting(node.card)) {
                node.card.setEventCallback(null)
            }
            node.card.cleanup()
        }
        this.eventListeners.clear()
        this.resultsListeners.clear()
        this.cachedOutputs.clear()
    }

    /**
     * Basic topological sort using Kahn's algorithm.
     *
     * Returns an array of nodes in topological order. In other words, in a directed graph where there is an edge from
     * A to B (A -> B), then A will appear before B in the returned array. With this implementation cycles WILL break stuff so don't do that...
     */
    private topoSort(): Node[] {
        //Completely ignore nodes that are not connected to anything
        const connected = new Set<NodeId>()
        this.edges.forEach((e) => {
            connected.add(e.from)
            connected.add(e.to)
        })

        // If there are no edges at all, there are no connected nodes to execute.
        if (connected.size === 0) return []

        // Compute in-degree per node (number of incoming edges)
        const inDeg = new Map([...connected].map((k) => [k, 0]))
        this.edges.forEach((e) => {
            if (inDeg.has(e.to)) {
                inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1)
            }
        })

        // Start with nodes that have in-degree 0 (no dependencies)
        const queue = [...inDeg].filter(([, d]) => d === 0).map(([k]) => k)
        const result: Node[] = []

        while (queue.length) {
            const id = queue.shift()!
            result.push(this.nodes.get(id)!)

            // Decrement in-degree for neighbors and enqueue when they reach 0
            this.edges
                .filter((e) => e.from === id)
                .forEach((e) => {
                    inDeg.set(e.to, inDeg.get(e.to)! - 1)
                    if (inDeg.get(e.to) === 0) queue.push(e.to)
                })
        }

        // Return the hopefully complete sorted list
        return result
    }

    async initCards() {
        await Promise.all(
            [...this.nodes.values()].map((node) => node.card.init()),
        )
    }

    destroyCards() {
        for (const [, node] of this.nodes) {
            node.card.cleanup()
        }
    }

    /**
     * Clears the entire graph.
     */
    clear() {
        this.dispose()
        this.nodes.clear()
        this.edges = []
        this.counter = 0
    }
}

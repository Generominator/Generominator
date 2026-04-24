import { test } from "vitest"
import { ExecutionGraph } from "../../src/execEngine"
import { DeCasteljauAlgorithmCard } from "../../src/cards/deCasteljauAlgorithm"
import { GenerateTextGrammarCard } from "../../src/cards/generateTextGrammar"
import { CreateCurves } from "../../src/cards/createCurves"
import { Word2Vec } from "../../src/cards/wordToVec"
import { PCA } from "../../src/cards/pca"

test("Exec Enginer: Curves to DeCasteljau", async () => {
    const graph = new ExecutionGraph()

    // Nodes
    const generateTextGrammarID = graph.addNode(new GenerateTextGrammarCard())
    const word2vecID = graph.addNode(new Word2Vec())
    const pcaID = graph.addNode(new PCA())
    const createCurvesID = graph.addNode(new CreateCurves())
    const deCasteljauID = graph.addNode(new DeCasteljauAlgorithmCard())

    graph.connect(generateTextGrammarID, 0, word2vecID, 0)
    graph.connect(word2vecID, 0, pcaID, 0)
    graph.connect(pcaID, 0, createCurvesID, 0)
    graph.connect(createCurvesID, 0, deCasteljauID, 0)
})
